import Navbar from "@/components/common/Navbar";
import Grid from "@/components/common/Grid";
import ProfileTable from "@/components/homepage/ProfileTable";
import RiskDistribution from "@/components/homepage/RiskDistribution";
import { fetchUsers } from "@/actions/fetchUsers";

export default async function Home() {
  try {
    // Fetch data from MongoDB using server action
    const peopleData = await fetchUsers();
    
    // Log data summary (not the entire data to avoid console overflow)
    // console.log(`Fetched ${peopleData.data.length} users for homepage`);
    
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <header className="sticky top-0 z-10">
          <Navbar
            data={{
              lastlastUpdated: new Date().toLocaleDateString(),
              activeUsers: peopleData.data.length || 0,
              conversationCount: 50,
            }}
            usersList={peopleData.data} // Pass the users list to Navbar
          />
        </header>
        <main className="overflow-y-scroll"> 
          <Grid>
            <ProfileTable data={peopleData.data} />
            <RiskDistribution data={peopleData.data}/>
          </Grid>
        </main>
      </div>
    );
  } catch (error) {
    console.error("Error in Home component:", error);
    
    // Return a fallback UI
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
        <p className="mt-2">Could not load user data. Please try again later.</p>
      </div>
    );
  }
}