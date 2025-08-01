//@ts-nocheck
import { Header, StatsCard, TripCard } from "../../../components";
import { getAllUsers, getUser } from "~/appwrite/auth";
import type { Route } from "./+types/dashboard";
import {
  getTripsByTravelStyle,
  getUsersAndTripsStats,
  getUserGrowthPerDay,
} from "~/appwrite/dashboard";
import { getAllTrips } from "~/appwrite/trips";
import { parseTripData } from "~/lib/utils";
import {
  Category,
  ChartComponent,
  ColumnDirective,
  ColumnsDirective,
  ColumnSeries,
  DataLabel,
  Inject,
  SeriesCollectionDirective,
  SeriesDirective,
  SplineAreaSeries,
  Tooltip,
  Legend,
} from "@syncfusion/ej2-react-charts";
import { tripyAxis, userXAxis, useryAxis, tripXAxis } from "~/constants";
import { GridComponent } from "@syncfusion/ej2-react-grids";

export async function clientLoader() {
  const [user, dashboardStats, trips, userGrowth, tripsByTravels, allUsers] =
    await Promise.all([
      getUser(),
      getUsersAndTripsStats(),
      getAllTrips(4, 0),
      getUserGrowthPerDay(),
      getTripsByTravelStyle(),
      getAllUsers(4, 0),
    ]);

  const allTrips = (trips.allTrips ?? [])
    .map(({ $id, tripDetail, imageUrls }) => {
      const parsed = parseTripData(tripDetail);
      return {
        id: $id,
        ...parsed,
        imageUrls: imageUrls ?? [],
      };
    })
    .filter((trip) => trip.name); // Optional filter for valid parsed trips

  const mappedUsers: UsersItineraryCount[] = allUsers.users.map((user) => ({
    imageUrl: user.imageUrl,
    name: user.name,
    count: user.itineraryCount ?? Math.floor(Math.random() * 10),
  }));

  // Filter out duplicate names, keeping only the first one
  const uniqueUsersByName = mappedUsers.filter(
    (user, index, self) => self.findIndex((u) => u.name === user.name) === index
  );

  const totalUsers = dashboardStats.totalUsers ?? 1;
  const fakeActiveUsers = Math.floor(Math.random() * totalUsers) + 1;
  const fakeCurrentMonthActive = Math.floor(Math.random() * 5) + 1;
  const fakeLastMonthActive = Math.floor(Math.random() * 5) + 1;

  return {
    user,
    dashboardStats: {
      ...dashboardStats,
      userRole: {
        ...dashboardStats.userRole,
        total: fakeActiveUsers,
        currentMonth: fakeCurrentMonthActive,
        lastMonth: fakeLastMonthActive,
      },
    },
    allTrips,
    userGrowth,
    tripsByTravels,
    allUsers: uniqueUsersByName,
  };
}

export function HydrateFallback() {
  const loading = true;

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-6 text-center mt-10">
      <img
        src={`/assets/icons/${loading ? "loader.svg" : "magic-star.svg"}`}
        alt="Loading"
        className={cn("size-6", { "animate-spin": loading })}
      />
      <p className="text-lg font-medium text-muted-foreground">
        Loading dashboard insights...
      </p>
    </div>
  );
}

const Dashboard = ({ loaderData }: Route.componentsProps) => {
  const {
    user,
    dashboardStats,
    allTrips,
    userGrowth,
    tripsByTravels,
    allUsers,
  } = loaderData;

  const trips = allTrips.map((trip) => ({
    imageUrl: trip.imageUrls[0],
    name: trip.name,
    interest: trip.interests,
  }));

  const usersAndTrips = [
    {
      title: "Latest user signups",
      dataSource: allUsers,
      field: "count",
      headerText: "Trips created",
    },
    {
      title: "Trips based on interests",
      dataSource: trips,
      field: "interest",
      headerText: "Interests",
    },
  ];

  return (
    <main className="dashboard wrapper">
      <Header
        title={`Hi, ${user?.name ?? "Guest"} 👋`}
        description="Track activity, trends, and popular destinations in real time"
      />

      <section className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <StatsCard
            headerTitle="Total Users"
            total={dashboardStats.totalUsers}
            currentMonthCount={dashboardStats.usersJoined?.currentMonth}
            lastMonthCount={dashboardStats.usersJoined?.lastMonth}
          />
          <StatsCard
            headerTitle="Total Trips"
            total={dashboardStats.totalTrips}
            currentMonthCount={dashboardStats.tripsCreated?.currentMonth}
            lastMonthCount={dashboardStats.tripsCreated?.lastMonth}
          />
          <StatsCard
            headerTitle="Active Users"
            total={dashboardStats.userRole?.total}
            currentMonthCount={dashboardStats.userRole?.currentMonth}
            lastMonthCount={dashboardStats.userRole?.lastMonth}
          />
        </div>
      </section>

      <section className="container">
        <h1 className="text-xl font-semibold text-dark-100">Created Trips</h1>
        <div className="trip-grid">
          {allTrips.map(
            ({
              id,
              name,
              imageUrls,
              itinerary,
              interests,
              travelStyle,
              estimatedPrice,
            }) => (
              <TripCard
                key={id}
                id={id.toString()}
                name={name}
                imageUrl={imageUrls[0]}
                location={itinerary?.[0]?.location ?? ""}
                tags={[interests, travelStyle]}
                price={estimatedPrice}
              />
            )
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ChartComponent
          id="chart-1"
          primaryXAxis={userXAxis}
          primaryYAxis={useryAxis}
          title="Users Growth"
          tooltip={{ enable: true }}
        >
          <Inject
            services={[
              ColumnSeries,
              SplineAreaSeries,
              Category,
              DataLabel,
              Tooltip,
              Legend,
            ]}
          />
          <SeriesCollectionDirective>
            <SeriesDirective
              dataSource={userGrowth}
              xName="day"
              yName="count"
              type="Column"
              name="Column"
              columnWidth={0.3}
              cornerRadius={{ topLeft: 10, topRight: 10 }}
            />
            <SeriesDirective
              dataSource={userGrowth}
              xName="day"
              yName="count"
              type="SplineArea"
              name="Wave"
              fill="rgba(71,132,238,0.15)"
              border={{ width: 2, color: "#4784EE" }}
            />
          </SeriesCollectionDirective>
        </ChartComponent>

        {tripsByTravels?.length === 0 ? (
          <p className="text-sm text-gray-500">No trip trend data available</p>
        ) : (
          <ChartComponent
            id="chart-2"
            primaryXAxis={tripXAxis}
            primaryYAxis={tripyAxis}
            title="Trip Trends"
            tooltip={{ enable: true }}
          >
            <Inject
              services={[
                ColumnSeries,
                SplineAreaSeries,
                Category,
                DataLabel,
                Tooltip,
                Legend,
              ]}
            />
            <SeriesCollectionDirective>
              <SeriesDirective
                dataSource={tripsByTravels}
                xName="travelStyle"
                yName="count"
                type="Column"
                name="Trips"
                columnWidth={0.3}
                cornerRadius={{ topLeft: 10, topRight: 10 }}
              />
              <SeriesDirective
                dataSource={tripsByTravels}
                xName="travelStyle"
                yName="count"
                type="SplineArea"
                name="Trend"
                fill="rgba(255,99,132,0.15)"
                border={{ width: 2, color: "#ff6384" }}
              />
            </SeriesCollectionDirective>
          </ChartComponent>
        )}
      </section>
      <section className="user-trip wrapper">
        {usersAndTrips.map(({ title, dataSource, field, headerText }, i) => (
          <div key={i} className="flex flex-col gap-5">
            <h3 className="p-20-semibold text-dark-100">{title}</h3>

            <GridComponent dataSource={dataSource} gridLines="None">
              <ColumnsDirective>
                <ColumnDirective
                  field="name"
                  headerText="Name"
                  width="200"
                  textAlign="Left"
                  template={(props: UserData) => (
                    <div className="flex items-center gap-1.5 px-4">
                      <img
                        src={props.imageUrl}
                        alt="user"
                        className="rounded-full size-8 aspect-square"
                        referrerPolicy="no-referrer"
                      />
                      <span>{props.name}</span>
                    </div>
                  )}
                />

                <ColumnDirective
                  field={field}
                  headerText={headerText}
                  width="150"
                  textAlign="left"
                />
              </ColumnsDirective>
            </GridComponent>
          </div>
        ))}
      </section>
    </main>
  );
};

export default Dashboard;
