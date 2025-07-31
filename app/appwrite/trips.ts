import { appwriteConfig, database } from "~/appwrite/client";
import { Query } from "appwrite";

// getting all trips
export const getAllTrips = async (limit: number, offset: number) => {
  const allTrips = await database.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.tripCollectionId,
    [Query.limit(limit), Query.offset(offset), Query.orderDesc("createdAt")]
  );
  if (allTrips.total === 0) {
    console.error("No Trips Found");
    return { allTrips: [], total: 0 };
  }

  return {
    allTrips: allTrips.documents,
    total: allTrips.total,
  };
};

//getting a specific trip by ID
export const getTripById = async (tripId: string) => {
  const trip = await database.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.tripCollectionId,
    tripId
  );
  if (!trip.$id) {
    console.log("Trip Not Found");
    return null;
  }
  return trip;
};
