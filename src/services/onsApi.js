import {
  ADMIN_DATASET_EDITION,
  DATA_YEAR,
  ENGLAND_WALES_DATASET_EDITION,
  ENGLAND_WALES_GEOGRAPHY_CODE,
  INITIAL_ADMIN_DATASET_VERSION,
  URLS,
} from "../constants/appConfig";

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

export async function fetchLatestAdminDatasetVersion() {
  const url = `${URLS.onsBase}/datasets/weekly-deaths-local-authority/editions/${ADMIN_DATASET_EDITION}/versions`;
  const responseJson = await fetchJson(url);
  return responseJson?.items?.[0]?.version || INITIAL_ADMIN_DATASET_VERSION;
}

export async function fetchLatestEnglandWalesDatasetVersion() {
  const url = `${URLS.onsBase}/datasets/weekly-deaths-age-sex/editions/${ENGLAND_WALES_DATASET_EDITION}/versions`;
  const responseJson = await fetchJson(url);
  return responseJson?.items?.[0]?.version || "";
}

export async function fetchLocalAuthorityDeaths({
  geography,
  placeOfDeath,
  version = INITIAL_ADMIN_DATASET_VERSION,
  year = DATA_YEAR,
}) {
  const url = `${URLS.onsBase}/datasets/weekly-deaths-local-authority/editions/${ADMIN_DATASET_EDITION}/versions/${version}/observations?time=${year}&geography=${geography}&week=*&causeofdeath=all-causes&placeofdeath=${placeOfDeath}&registrationoroccurrence=registrations`;
  return fetchJson(url);
}

export async function fetchEnglandWalesDeaths({ version, year = DATA_YEAR }) {
  const url = `${URLS.onsBase}/datasets/weekly-deaths-age-sex/editions/${ENGLAND_WALES_DATASET_EDITION}/versions/${version}/observations?time=${year}&geography=${ENGLAND_WALES_GEOGRAPHY_CODE}&week=*&sex=all&agegroups=all-ages&deaths=total-registered-deaths`;
  return fetchJson(url);
}
