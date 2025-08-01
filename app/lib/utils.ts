import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateString: string): string => {
  return dayjs(dateString).format("MMMM DD, YYYY");
};

export function parseMarkdownToJson(markdownText: string): unknown | null {
  const regex = /```json\s*([\s\S]+?)\s*```/;
  const match = markdownText.match(regex);

  let rawJson = match?.[1] ?? markdownText.trim();

  if (!rawJson.startsWith("{") || !rawJson.endsWith("}")) {
    console.error("Content doesn't look like valid JSON:", rawJson);
    return null;
  }

  try {
    return JSON.parse(rawJson);
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return null;
  }
}
// export function parseTripData(data: unknown) {
//   if (
//     typeof data !== "string" ||
//     data === "undefined" ||
//     data === "" ||
//     !data.trim().startsWith("{")
//   ) {
//     return {}; // Silent fallback
//   }

//   try {
//     return JSON.parse(data);
//   } catch {
//     return {}; // Silent parse fail
//   }
// }
export function parseTripData(
  data: unknown
): { travelStyle?: string } & Record<string, unknown> {
  // Early return for non-string or empty data
  if (typeof data !== "string" || !data.trim()) {
    console.warn("parseTripData: Invalid input - expected non-empty string");
    return { travelStyle: undefined };
  }

  try {
    const parsed = JSON.parse(data);

    // Validate basic structure
    if (typeof parsed !== "object" || parsed === null) {
      console.warn("parseTripData: Parsed data is not an object");
      return { travelStyle: undefined };
    }

    return parsed;
  } catch (error) {
    console.warn("parseTripData: Failed to parse JSON:", error);
    return { travelStyle: undefined };
  }
}

export function getFirstWord(input: unknown): string {
  return String(input).trim().split(/\s+/)[0] || "";
}

export const calculateTrendPercentage = (
  countOfThisMonth: number,
  countOfLastMonth: number
): TrendResult => {
  if (countOfLastMonth === 0) {
    return countOfThisMonth === 0
      ? { trend: "no change", percentage: 0 }
      : { trend: "increment", percentage: 100 };
  }

  const change = countOfThisMonth - countOfLastMonth;
  const percentage = Math.abs((change / countOfLastMonth) * 100);

  if (change > 0) {
    return { trend: "increment", percentage };
  } else if (change < 0) {
    return { trend: "decrement", percentage };
  } else {
    return { trend: "no change", percentage: 0 };
  }
};

export const formatKey = (key: keyof TripFormData) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};
