import geoNameArr from "./geoNameArr";
import geoPopDict from "./geoPopDict";

export const locations = geoNameArr;

export const locationOptions = geoNameArr.map((item) => ({
  label: item.name,
  value: item.id,
}));

export const locationNameToId = Object.fromEntries(
  geoNameArr.map((item) => [item.name, item.id]),
);

export const locationPopulationById = geoPopDict;
