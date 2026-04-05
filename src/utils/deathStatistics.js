export function getWeekNumber(observation) {
  const label = observation?.dimensions?.Week?.label || "";
  const weekNumber = Number.parseInt(label.replace("Week", "").trim(), 10);
  return Number.isNaN(weekNumber) ? 0 : weekNumber;
}

export function sortObservationsByWeek(observations = []) {
  return [...observations].sort((left, right) => {
    return getWeekNumber(left) - getWeekNumber(right);
  });
}

export function getLatestObservation(observations = []) {
  return sortObservationsByWeek(observations)
    .reverse()
    .find((observation) => observation?.observation !== "");
}

export function getLatestObservationValue(observations = []) {
  const latestObservation = getLatestObservation(observations);
  const value = Number.parseInt(latestObservation?.observation ?? "0", 10);
  return Number.isNaN(value) ? 0 : value;
}

export function getLatestObservationLabel(observations = []) {
  return getLatestObservation(observations)?.dimensions?.Week?.label || "";
}

export function calculateDeathRate(totalDeaths, population) {
  if (!population) {
    return "0.00";
  }

  return ((Number(totalDeaths) / Number(population)) * 10000).toFixed(2);
}

export function calculateDeadlihoodText(locationRate, englandWalesRate) {
  const location = Number(locationRate);
  const baseline = Number(englandWalesRate);

  if (!baseline) {
    return "";
  }

  const percentage = 100 - Math.round((location / baseline) * 100);
  return percentage < 0
    ? `${Math.abs(percentage)}% more`
    : `${percentage}% less`;
}
