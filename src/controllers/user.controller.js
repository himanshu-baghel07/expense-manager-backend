import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import jwt from "jsonwebtoken";
// import * as CryptoJS from "crypto-js";
import CryptoJS from "crypto-js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generate access and refresh tokens",
    );
  }
};
const decryptPayload = (encryptedPayload) => {
  console.log("Step1", encryptedPayload);
  const bytes = CryptoJS.AES.decrypt(encryptedPayload, "hello0");
  console.log("Its decrypting");
  const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
  console.log("before parse", decryptedData);
  return JSON.parse(decryptedData); // Parse back to original request body
};

const registerUser = asyncHandler(async (req, res) => {
  console.log("Request body:", req.body);
  console.log("Request files:", req.files);
  console.log("Request body:", req.body.encryptedRequestBody);

  if (!req.body.encryptedRequestBody) {
    throw new ApiError(400, "Encrypted data is missing");
  }

  const decryptedRequestBody = decryptPayload(req.body.encryptedRequestBody);
  console.log("Decrypted data:", decryptedRequestBody);

  const { fullName, email, username, password } = decryptedRequestBody;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // const avatarLocalPath = req.files?.avatar[0]?.path;

  // if (!avatarLocalPath) {
  //   throw new ApiError(400, "Avatar file is required");
  // }

  // let coverImageLocalPath;
  // if (
  //   req.files &&
  //   Array.isArray(req.files.coverImage) &&
  //   req.files.coverImage.length > 0
  // ) {
  //   coverImageLocalPath = req.files.coverImage[0].path;
  // }

  // const avatar = await uploadOnCloudinary(avatarLocalPath);
  // const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  const user = await User.create({
    fullName,
    // avatar: avatar.url,
    // coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, "user registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  if (!req.body.encryptedRequestBody) {
    throw new ApiError(400, "Encrypted data is missing");
  }

  const decryptedRequestBody = decryptPayload(req.body.encryptedRequestBody);

  const { email, username, password } = decryptedRequestBody;

  if (!username && !email) {
    throw new ApiError(400, "Username or password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
  //   user._id,
  // );

  const loggedInUser = await User.findById(user._id).select("-password ");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
      },
      "User logged in successfully",
    ),
  );
});

const authenticate = asyncHandler(async (req, res) => {
  if (!req.body.encryptedRequestBody) {
    throw new ApiError(400, "Encrypted data is missing");
  }

  const decryptedRequestBody = decryptPayload(req.body.encryptedRequestBody);

  const { userId } = decryptedRequestBody;

  if (!userId) {
    throw new ApiError(400, "User ID is missing");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(userId);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      message: "Tokens generated successfully",
      accessToken,
      refreshToken,
    });
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token is refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  authenticate,
};
