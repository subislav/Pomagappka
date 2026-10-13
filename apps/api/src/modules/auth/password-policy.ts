import { APIError } from "better-auth/api";

export function assertPasswordPolicy(password: string): void {
  if (password.length < 8 || password.length > 128) {
    throw new APIError("BAD_REQUEST", {
      code: "PASSWORD_TOO_WEAK",
      message:
        "Hasło musi mieć co najmniej 8 znaków, w tym wielką literę, małą literę i cyfrę.",
    });
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new APIError("BAD_REQUEST", {
      code: "PASSWORD_TOO_WEAK",
      message:
        "Hasło musi mieć co najmniej 8 znaków, w tym wielką literę, małą literę i cyfrę.",
    });
  }
}

export function passwordSameAsLastError(): APIError {
  return new APIError("BAD_REQUEST", {
    code: "PASSWORD_SAME_AS_LAST",
    message: "Nowe hasło nie może być takie samo jak poprzednie.",
  });
}
