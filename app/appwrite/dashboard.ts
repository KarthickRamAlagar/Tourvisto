import { parseTripData } from "~/lib/utils";
import { database, appwriteConfig } from "./client";
import { cachedQuery } from "./cache";
import { Query } from "appwrite";
interface Document {
  [key: string]: any;
}

type FilterByDate = (
  items: Document[],
  key: string,
  start: string,
  end?: string
) => number;

// export const getUsersAndTripsStats = async (): Promise<DashboardStats> => {
//   const d = new Date();
//   const startCurrent = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
//   const startPrev = new Date(
//     d.getFullYear(),
//     d.getMonth() - 1,
//     1
//   ).toISOString();
//   const endPrev = new Date(d.getFullYear(), d.getMonth(), 0).toISOString();

//   const [users, trips] = await Promise.all([
//     database.listDocuments(
//       appwriteConfig.databaseId,
//       appwriteConfig.userCollectionId
//     ),
//     database.listDocuments(
//       appwriteConfig.databaseId,
//       appwriteConfig.tripCollectionId
//     ),
//   ]);

//   const filterByDate: FilterByDate = (items, key, start, end) =>
//     items.filter((item) => item[key] >= start && (!end || item[key] <= end))
//       .length;

//   const filterUsersByRole = (role: string) => {
//     return users.documents.filter((u: Document) => u.status === role);
//   };

//   return {
//     totalUsers: users.total,
//     usersJoined: {
//       currentMonth: filterByDate(
//         users.documents,
//         "joinedAt",
//         startCurrent,
//         undefined
//       ),
//       lastMonth: filterByDate(users.documents, "joinedAt", startPrev, endPrev),
//     },
//     userRole: {
//       total: filterUsersByRole("user").length,
//       currentMonth: filterByDate(
//         filterUsersByRole("user"),
//         "joinedAt",
//         startCurrent,
//         undefined
//       ),
//       lastMonth: filterByDate(
//         filterUsersByRole("user"),
//         "joinedAt",
//         startPrev,
//         endPrev
//       ),
//     },
//     totalTrips: trips.total,
//     tripsCreated: {
//       currentMonth: filterByDate(
//         trips.documents,
//         "createdAt",
//         startCurrent,
//         undefined
//       ),
//       lastMonth: filterByDate(
//         filterUsersByRole("user"),
//         "joinedAt",
//         startPrev,
//         endPrev
//       ),
//     },
//   };
// };

export const getUsersAndTripsStats = async (): Promise<DashboardStats> => {
  return cachedQuery("dashboardStats", async () => {
    const d = new Date();
    const startCurrent = new Date(
      d.getFullYear(),
      d.getMonth(),
      1
    ).toISOString();
    const startPrev = new Date(
      d.getFullYear(),
      d.getMonth() - 1,
      1
    ).toISOString();
    const endPrev = new Date(d.getFullYear(), d.getMonth(), 0).toISOString();

    const [users, trips] = await Promise.all([
      database.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId
      ),
      database.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.tripCollectionId
      ),
    ]);

    const filterByDate: FilterByDate = (items, key, start, end) =>
      items.filter((item) => item[key] >= start && (!end || item[key] <= end))
        .length;

    const filterUsersByRole = (role: string) => {
      return users.documents.filter((u: Document) => u.status === role);
    };

    return {
      totalUsers: users.total,
      usersJoined: {
        currentMonth: filterByDate(
          users.documents,
          "joinedAt",
          startCurrent,
          undefined
        ),
        lastMonth: filterByDate(
          users.documents,
          "joinedAt",
          startPrev,
          endPrev
        ),
      },
      userRole: {
        total: filterUsersByRole("user").length,
        currentMonth: filterByDate(
          filterUsersByRole("user"),
          "joinedAt",
          startCurrent,
          undefined
        ),
        lastMonth: filterByDate(
          filterUsersByRole("user"),
          "joinedAt",
          startPrev,
          endPrev
        ),
      },
      totalTrips: trips.total,
      tripsCreated: {
        currentMonth: filterByDate(
          trips.documents,
          "createdAt",
          startCurrent,
          undefined
        ),
        lastMonth: filterByDate(
          // Fixed: This was incorrectly filtering users instead of trips
          trips.documents,
          "createdAt",
          startPrev,
          endPrev
        ),
      },
    };
  });
};
export const getUserGrowthPerDay = async () => {
  const users = await database.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.userCollectionId
  );

  const userGrowth = users.documents.reduce(
    (acc: { [key: string]: number }, user: Document) => {
      const date = new Date(user.joinedAt);
      const day = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    },
    {}
  );

  return Object.entries(userGrowth).map(([day, count]) => ({
    count: Number(count),
    day,
  }));
};

export const getTripsCreatedPerDay = async () => {
  const trips = await database.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.tripCollectionId
  );

  const tripsGrowth = trips.documents.reduce(
    (acc: { [key: string]: number }, trip: Document) => {
      const date = new Date(trip.createdAt);
      const day = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    },
    {}
  );

  return Object.entries(tripsGrowth).map(([day, count]) => ({
    count: Number(count),
    day,
  }));
};

// export const getTripsByTravelStyle = async () => {
//   const trips = await database.listDocuments(
//     appwriteConfig.databaseId,
//     appwriteConfig.tripCollectionId
//   );

//   const brokenTripIds: string[] = [];

//   const travelStyleCounts = trips.documents.reduce(
//     (acc: { [key: string]: number }, trip: Document) => {
//       const { $id, tripDetails } = trip;

//       if (typeof tripDetails !== "string" || tripDetails === "undefined") {
//         brokenTripIds.push($id);
//         return acc;
//       }

//       let parsed;
//       try {
//         parsed = JSON.parse(tripDetails);
//       } catch (err) {
//         brokenTripIds.push($id);
//         return acc;
//       }

//       if (!parsed.travelStyle || typeof parsed.travelStyle !== "string") {
//         return acc;
//       }

//       const normalized = parsed.travelStyle.trim().toLowerCase();
//       acc[normalized] = (acc[normalized] || 0) + 1;
//       return acc;
//     },
//     {}
//   );

//   for (const tripId of brokenTripIds) {
//     try {
//       await database.updateDocument(
//         appwriteConfig.databaseId,
//         appwriteConfig.tripCollectionId,
//         tripId,
//         {
//           tripDetails: JSON.stringify({ travelStyle: "luxury" }),
//         }
//       );
//     } catch {
//       // Silently fail
//     }
//   }

//   if (brokenTripIds.length > 0) {
//     travelStyleCounts["luxury"] =
//       (travelStyleCounts["luxury"] || 0) + brokenTripIds.length;
//   }

//   const chartData = Object.entries(travelStyleCounts).map(
//     ([travelStyle, count]) => ({
//       count,
//       travelStyle,
//     })
//   );

//   if (chartData.length === 0) {
//     return [{ travelStyle: "luxury", count: 1 }];
//   }

//   return chartData;
// };
// export const getTripsByTravelStyle = async () => {
//   const trips = await database.listDocuments(
//     appwriteConfig.databaseId,
//     appwriteConfig.tripCollectionId
//   );

//   const travelStyleCounts = trips.documents.reduce(
//     (acc: { [key: string]: number }, trip: Document) => {
//       const tripDetail = parseTripData(trip.tripDetails);

//       if (tripDetail && tripDetail.travelStyle) {
//         const travelStyle = tripDetail.travelStyle;
//         acc[travelStyle] = (acc[travelStyle] || 0) + 1;
//       }
//       return acc;
//     },
//     {}
//   );

//   return Object.entries(travelStyleCounts).map(([travelStyle, count]) => ({
//     count: Number(count),
//     travelStyle,
//   }));
// };

// export const getTripsByTravelStyle = async () => {
//   const trips = await database.listDocuments(
//     appwriteConfig.databaseId,
//     appwriteConfig.tripCollectionId
//   );

//   const travelStyleCounts: Record<string, number> = {};
//   const malformedTripIds: string[] = [];

//   for (const trip of trips.documents) {
//     const { $id, tripDetails } = trip;

//     if (
//       typeof tripDetails !== "string" ||
//       tripDetails === "undefined" ||
//       tripDetails === "" ||
//       !tripDetails.trim().startsWith("{")
//     ) {
//       malformedTripIds.push($id);
//       continue;
//     }

//     const parsed = parseTripData(tripDetails);

//     if (!parsed.travelStyle || typeof parsed.travelStyle !== "string") {
//       continue;
//     }

//     const normalized = parsed.travelStyle.trim().toLowerCase();
//     travelStyleCounts[normalized] = (travelStyleCounts[normalized] || 0) + 1;
//   }

//   if (malformedTripIds.length > 0) {
//     console.warn("🛠 Malformed tripDetails in trips:", malformedTripIds);
//     travelStyleCounts["luxury"] =
//       (travelStyleCounts["luxury"] || 0) + malformedTripIds.length;
//   }

//   const chartData = Object.entries(travelStyleCounts).map(
//     ([travelStyle, count]) => ({
//       count,
//       travelStyle,
//     })
//   );

//   return chartData.length === 0
//     ? [{ travelStyle: "luxury", count: 1 }]
//     : chartData;
// };

// export const getTripsByTravelStyle = async () => {
//   const trips = await database.listDocuments(
//     appwriteConfig.databaseId,
//     appwriteConfig.tripCollectionId
//   );

//   const travelStyleCounts: Record<string, number> = {};
//   const fallbackCount = trips.documents.reduce((count, trip) => {
//     const parsed = parseTripData(trip.tripDetails);
//     if (parsed.travelStyle && typeof parsed.travelStyle === "string") {
//       const normalized = parsed.travelStyle.trim().toLowerCase();
//       travelStyleCounts[normalized] = (travelStyleCounts[normalized] || 0) + 1;
//     } else {
//       count++;
//     }
//     return count;
//   }, 0);

//   if (fallbackCount > 0) {
//     travelStyleCounts["luxury"] =
//       (travelStyleCounts["luxury"] || 0) + fallbackCount;
//   }

//   const chartData = Object.entries(travelStyleCounts).map(
//     ([travelStyle, count]) => ({
//       count,
//       travelStyle,
//     })
//   );

//   return chartData.length === 0
//     ? [{ travelStyle: "luxury", count: 1 }]
//     : chartData;
// };

// export const getTripsByTravelStyle = async () => {
//   const trips = await database.listDocuments(
//     appwriteConfig.databaseId,
//     appwriteConfig.tripCollectionId
//   );

//   // 1. Simplify the counting logic like mentor's version
//   const travelStyleCounts = trips.documents.reduce(
//     (acc: { [key: string]: number }, trip) => {
//       try {
//         // 2. Use the exact same data access pattern as mentor
//         const tripDetail = parseTripData(trip.tripDetails);

//         // 3. Remove the fallback style check - assume data is correct
//         if (tripDetail?.travelStyle) {
//           const travelStyle = tripDetail.travelStyle;
//           acc[travelStyle] = (acc[travelStyle] || 0) + 1;
//         }
//       } catch (error) {
//         console.error("Error processing trip:", trip.$id, error);
//       }
//       return acc;
//     },
//     {}
//   );

//   // 4. Return empty array if no data (let the UI handle it)
//   return Object.entries(travelStyleCounts).map(([travelStyle, count]) => ({
//     count: Number(count),
//     travelStyle,
//   }));
// };

export const getTripsByTravelStyle = async () => {
  try {
    const trips = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.tripCollectionId,
      [Query.orderDesc("$createdAt")] // Get newest trips first
    );

    // Debug: Log first 3 trips to verify data
    console.log(
      "Sample trips:",
      trips.documents.slice(0, 3).map((t) => ({
        id: t.$id,
        travelStyle: t.travelStyle,
        hasDetails: !!t.tripDetails,
        parsedStyle: parseTripData(t.tripDetails)?.travelStyle,
      }))
    );

    const styleCounts = trips.documents.reduce(
      (acc, trip) => {
        try {
          // First try direct property, then parsed details
          const style =
            trip.travelStyle || parseTripData(trip.tripDetails)?.travelStyle;

          if (style && typeof style === "string") {
            const normalized = style.toLowerCase().trim();
            acc[normalized] = (acc[normalized] || 0) + 1;
          }
        } catch (error) {
          console.error("Error processing trip:", trip.$id, error);
        }
        return acc;
      },
      {} as Record<string, number>
    );

    // Format for chart
    const chartData = Object.entries(styleCounts).map(([style, count]) => ({
      travelStyle: style.charAt(0).toUpperCase() + style.slice(1), // Capitalize
      count,
    }));

    console.log("Processed trip styles:", chartData);

    return chartData.length > 0
      ? chartData
      : [{ travelStyle: "Luxury", count: 0 }]; // Empty state
  } catch (error) {
    console.error("Failed to get trips by style:", error);
    return [{ travelStyle: "Luxury", count: 0 }];
  }
};

const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
