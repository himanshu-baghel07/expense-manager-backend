class ApiError {
  constructor(
    statusCode,
    messgae = "Something went wrong",
    errors = [],
    stacks = "",
  ) {
    super(messgae);
    (this.statusCode = statusCode),
      (this.messgae = messgae),
      (this.data = null),
      (this.success = false),
      (this.errors = errors);

    if (stacks) {
      this.stacks = stacks;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
