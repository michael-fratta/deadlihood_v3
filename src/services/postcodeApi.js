import { URLS } from "../constants/appConfig";

export async function fetchAdminDistrictByPostcode(postcode) {
  const response = await fetch(`${URLS.postcodesBase}/postcodes/${postcode}`);
  const responseJson = await response.json();

  if (!response.ok || !responseJson?.result?.admin_district) {
    const error = new Error("Invalid postcode");
    error.code = "INVALID_POSTCODE";
    throw error;
  }

  return responseJson.result.admin_district;
}
