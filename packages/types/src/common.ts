export interface ApiError {
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  errors: ApiError[];
}

export interface MessageResponse {
  success: boolean;
  message: string;
}
