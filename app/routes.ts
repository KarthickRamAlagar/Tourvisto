import { type RouteConfig, layout, route } from "@react-router/dev/routes";

export default [
  route("sign-in", "routes/root/signIn.tsx"),
  route("api/create-trip", "routes/api/create-trip.ts"),

  layout("routes/admin/AdminLayout.tsx", [
    route("", "routes/admin/dashboard.tsx"), 
    route("all-users", "routes/admin/AllUsers.tsx"),
    route("trips", "routes/admin/Trips.tsx"),
    route("trips/create", "routes/admin/CreateTrips.tsx"),
    route("trips/:tripId", "routes/admin/TripDetail.tsx"),
  ]),
] satisfies RouteConfig;
