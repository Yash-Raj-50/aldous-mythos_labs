'use client';
import Image from 'next/image';
import { HomepageData } from '@/actions/fetchHomepageData';
import { useState } from 'react'; // Import useState
import dummyAgentLogo from '@/assets/dummy_agent_logo.png'; // Import dummy logo

// Use the Agent type from HomepageData
interface AgentGridProps {
  agents: HomepageData['agents'];
  currentUser: HomepageData['currentUser'];
}

const AgentGrid: React.FC<AgentGridProps> = ({ agents, currentUser }) => {
  const [agentIconErrorStates, setAgentIconErrorStates] = useState<Record<string, boolean>>({});
  const [dummyIconErrorStates, setDummyIconErrorStates] = useState<Record<string, boolean>>({});

  const handleAgentIconError = (agentId: string) => {
    setAgentIconErrorStates(prev => ({ ...prev, [agentId]: true }));
  };

  const handleDummyIconError = (agentId: string) => {
    setDummyIconErrorStates(prev => ({ ...prev, [agentId]: true }));
  };

  // Filter agents based on current user's assigned agents
  const filteredAgents = agents.filter(agent => {
    // If user is superuser, show all agents
    if (currentUser?.userClass === 'superuser') {
      return true;
    }
    
    // For regular users, only show agents they have access to
    if (currentUser?.agents) {
      return currentUser.agents.includes(agent.id);
    }
    
    return false;
  });

  const getInitials = (name: string) => {
    if (!name) return 'AG';
    const words = name.split(' ');
    if (words.length > 1) {
      return words[0][0].toUpperCase() + words[1][0].toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Explicitly define the type for socialHandles if it's not directly available
  // For now, assuming it's part of the agent object structure or can be inferred.
  // If AgentForTable was meant to have a specific socialHandles structure, define it here or import it.
  // Social IDs renderer (currently unused)
  // const renderSocialIds = (socialHandles: Record<string, unknown>) => {
  //   if (!socialHandles || Object.keys(socialHandles).length === 0) return <span className="text-sm text-gray-400">No social IDs</span>;

  //   const availableHandles = Object.entries(socialHandles)
  //     .filter(([, value]) => value) // Ensure value exists
  //     .map(([platform, id]) => (
  //       <span key={platform} className="text-xs mr-2 capitalize">
  //         {platform}: {String(id)} {/* Ensure id is string */}
  //       </span>
  //     ));
  //   return availableHandles.length > 0 ? availableHandles : <span className="text-sm text-gray-400">No social IDs</span>;
  // };

  return (
    <div className="col-span-2 lg:col-span-4 bg-blue-600/15 border-4 border-[#253A5C] rounded-lg p-4 px-8 shadow-lg h-[250px]">
      <h2 className="text-xl font-bold text-black">Your Agents</h2>
      {filteredAgents && filteredAgents.length > 0 ? (
        <div className="flex overflow-x-auto space-x-4 p-4 scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-300">
          {filteredAgents.map((agent) => {
            const agentIconHasError = agentIconErrorStates[agent.id];
            const dummyIconHasError = dummyIconErrorStates[agent.id];

            return (
              <div
                key={agent.id}
                className="bg-[#253A5C]/70 rounded-xl shadow-md p-5 w-[400px] h-[150px] flex flex-row relative transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <div className="flex-shrink-0 w-1/4 flex flex-col items-center justify-center">
                  {/* Agent Icon with fallback logic */}
                  <div className="flex justify-center">
                    {agent.icon && !agentIconHasError ? (
                      <Image
                        src={agent.icon}
                        alt={`${agent.name} icon`}
                        width={80}
                        height={80}
                        className="rounded-full object-cover border-2 border-gray-200"
                        onError={() => handleAgentIconError(agent.id)}
                      />
                    ) : !dummyIconHasError ? (
                      <Image
                        src={dummyAgentLogo.src}
                        alt={`${agent.name} icon (fallback)`}
                        width={80}
                        height={80}
                        className="rounded-full object-cover border-2 border-gray-200"
                        onError={() => handleDummyIconError(agent.id)}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-bold border-2 border-gray-200">
                        {getInitials(agent.name)}
                      </div>
                    )}
                  </div>
                </div>
                <div className='flex flex-col justify-between w-3/4 pl-2 pr-2'>
                  {/* Active Status Pill */}
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium flex items-center
                  ${agent.activeStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    <span className={`w-2 h-2 rounded-full mr-2 ${agent.activeStatus ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {agent.activeStatus ? 'Active' : 'Inactive'}
                  </div>

                  <div>

                  {/* Agent Name */}
                  <h3 className="text-xl font-bold text-white mb-1 mr-12 wrap" title={agent.name}>
                    {agent.name}
                  </h3>

                  <div className="flex flex-col gap-1 text-sm text-[#253A5C]"> {/* Changed from flex-wrap, items-center, text-gray-700 */}
                    {agent.phone && (
                      <span className="truncate bg-gray-100/90 max-w-fit p-1 px-2 font-semibold border-1 rounded" title={agent.phone}>{agent.phone}</span>
                    )}
                    {agent.socialID && (
                      <span className="truncate bg-gray-100/90 max-w-fit p-1 px-2 font-semibold border-1 rounded" title={agent.socialID}>{agent.socialID}</span>
                    )}
                    {!agent.phone && !agent.socialID && (
                      <span className="text-sm text-gray-300 italic">None provided</span>
                    )}
                  </div>

                  </div>
                  {/* Assigned Profiles Count - Corrected to use profileCount */}
                  <p className="text-sm text-gray-200">
                    {agent.profileCount} Assigned Profile{agent.profileCount !== 1 ? 's' : ''}
                  </p>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-[#253A5C]">No agents to display.</p>
        </div>
      )}
    </div>
  );
};

export default AgentGrid;

// Basic scrollbar styling (optional, can be added to globals.css for wider application)
// Ensure Tailwind JIT mode is enabled to pick these up if not already.
// For Webkit browsers (Chrome, Safari, newer Edge):
// .scrollbar-thin::-webkit-scrollbar { width: 8px; height: 8px; }
// .scrollbar-thumb-blue-700::-webkit-scrollbar-thumb { background-color: #2b6cb0; border-radius: 4px; }
// .scrollbar-track-blue-300::-webkit-scrollbar-track { background-color: #90cdf4; border-radius: 4px; }
// For Firefox:
// Add to globals.css or a global style block:
// * { scrollbar-width: thin; scrollbar-color: #2b6cb0 #90cdf4; }
// Note: Firefox scrollbar styling is less customizable via CSS utility classes directly.
