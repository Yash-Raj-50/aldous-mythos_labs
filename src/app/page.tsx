import Navbar from "@/components/common/Navbar";
import Grid from "@/components/common/Grid";
import ProfileTable from "@/components/homepage/ProfileTable";
import RiskDistribution from "@/components/homepage/RiskDistribution";
import { fetchHomepageData } from "@/actions/fetchHomepageData";
import AgentGrid from "@/components/homepage/AgentGrid"; // Add this import
import { redirect } from 'next/navigation';

export default async function Home() {
  // Fetch data from MongoDB using the new server action
  const homepageData = await fetchHomepageData();
  // If unauthenticated or token missing, redirect to login
  if (!homepageData) {
    redirect('/auth/login');
  }

  const { agents, profiles, analyses, chatSessions, currentUser, userDetails } = homepageData;

  // Calculate total conversation count
  const totalConversationCount = Object.values(chatSessions).reduce(
    (sum, sessions) => sum + (sessions?.length || 0),
    0
  );

  // Format current date for last updated
  const formatCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="sticky top-0 z-10">
        <Navbar
          data={{
            lastUpdated: formatCurrentDate(),
            activeUsers: profiles.length || 0,
            conversationCount: totalConversationCount,
          }}
          usersList={profiles}
          currentUser={currentUser}
        />
      </header>
      <main className="overflow-y-scroll p-4 max-w-screen-xl mx-auto">
        <h1 className="text-4xl font-extralight px-8 py-4">
          Welcome,
          <span className="bg-gradient-to-r from-[#253A5C] to-blue-600 bg-clip-text text-transparent">
            {' ' + (currentUser?.username || 'User')}
          </span>
        </h1>
        <Grid>
          <AgentGrid
            agents={agents.map(agent => ({
              ...agent,
              activeStatus: agent.activeStatus ?? false
            }))}
          />
          <ProfileTable
            profiles={profiles}
            analyses={analyses}
            userDetails={userDetails}
            agents={agents}
          />
          <RiskDistribution profiles={profiles} analyses={analyses} />
        </Grid>
      </main>
    </div>
  );
}