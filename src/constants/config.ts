export const Config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
};

export const Features = {
  backendEnabled: Config.apiUrl.length > 0,
};
