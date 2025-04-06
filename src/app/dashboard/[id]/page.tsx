'use client'
import { useState, useRef, useEffect } from "react";
import Grid from "@/components/common/Grid";
import Navbar from "@/components/common/Navbar";
import EmotionalIcebergAnalysis from "@/components/dashboard/EmotionalIcebergAnalysis/EmotionalIcebergAnalysis";
import ExecutiveSummary from "@/components/dashboard/ExecutiveSummary/ExecutiveSummary";
import InterventionEffectiveness from "@/components/dashboard/InterventionEffectiveness/InterventionEffectiveness";
import KeyInflectionPoints from "@/components/dashboard/KeyInflectionPoints/KeyInflectionPoints";
import RadStageAssessment from "@/components/dashboard/RadStageAssessment/RadStageAssessment";
import RecommendedApproaches from "@/components/dashboard/RecommendedApproaches/RecommendedApproaches";
import RiskAssessment from "@/components/dashboard/RiskAssessment/RiskAssessment";
import UnmetPsycNeeds from "@/components/dashboard/UnmetPsycNeeds/UnmetPsycNeeds";
import ChatHistory from "@/components/dashboard/ChatHistory/ChatHistory";
import { usePathname } from "next/navigation";
import { Button } from "@mui/material";
import { fetchUserDetails } from "@/actions/fetchUserDetails";
import { fetchUsers } from "@/actions/fetchUsers";
import html2canvas from "html2canvas";
import domtoimage from "dom-to-image-more"; // Import dom-to-image-more for better image generation
import jsPDF from "jspdf";


const Page = () => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);

  const gridRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const userID = pathname.split("/")[2];

  // Fetch user details when the component mounts or userID changes
  useEffect(() => {
    const loadUserData = async () => {
      if (!userID) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch the user details
        const userDetails = await fetchUserDetails(userID);

        if (!userDetails) {
          setError('User not found');
          return;
        }

        setUserData(userDetails);

        // Also fetch the users list for the dropdown
        const { data } = await fetchUsers();
        setUsersList(data);
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userID]);

  // Function to generate PDF from the Grid component
  const handleDownloadPDF = async () => {
    if (!gridRef.current || isGeneratingPDF) return;

    try {
      setIsGeneratingPDF(true);

      // Get the timestamp for the filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `dashboard-${userID}-${timestamp}.pdf`;

      // Create new PDF document with A4 dimensions
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Get the grid element
      const gridElement = gridRef.current;

      // Create a clone of the grid to apply temporary styles
      const clone = gridElement.cloneNode(true) as HTMLElement;
      document.body.appendChild(clone);

      // Position the clone off-screen
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.width = `${gridElement.offsetWidth}px`;

      // Add a class for PDF-specific styling
      clone.classList.add('for-pdf-export');

      // Apply PDF-specific styles to fix borders and text
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .for-pdf-export * {
          border-width: 0.05px !important;
          line-height: 1.3 !important;
        }
        .for-pdf-export h3 {
          margin-bottom: 8px !important;
        }
        .for-pdf-export p {
          margin-bottom: 4px !important;
        }
        .for-pdf-export .shadow-md {
          box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
        }
        .for-pdf-export text {
          font-size: 90% !important;
        }
      `;
      document.head.appendChild(styleElement);

      // Calculate the total height of the content
      const elemHeight = clone.offsetHeight;
      const elemWidth = clone.offsetWidth;
      const ratio = elemHeight / elemWidth;

      console.log("Generating PDF...");

      // Add a small delay to ensure all styles are applied
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use dom-to-image-more with PNG for better quality
      const dataUrl = await domtoimage.toPng(clone, {
        quality: 1,
        bgcolor: '#F8F9FB',
        width: elemWidth,
        height: elemHeight,
        style: {
          transform: 'scale(1)', // Ensure no scaling issues
        }
      });

      // Remove the clone and style element
      document.body.removeChild(clone);
      document.head.removeChild(styleElement);

      // Calculate PDF dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdfWidth * ratio;

      // If content is taller than a single page, we need to split it
      let heightLeft = pdfHeight;
      let position = 0;
      let pageCount = 1;

      // Add first page with image
      pdf.addImage(
        dataUrl,
        "PNG", // Use PNG instead of JPEG for better text clarity
        0,
        position,
        pdfWidth,
        pdfHeight
      );

      // If content requires multiple pages
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position = -pdf.internal.pageSize.getHeight() * pageCount;
        pdf.addPage();
        pdf.addImage(
          dataUrl,
          "PNG",
          0,
          position,
          pdfWidth,
          pdfHeight
        );
        heightLeft -= pdf.internal.pageSize.getHeight();
        pageCount++;
      }

      // Save the PDF
      pdf.save(filename);
      console.log("PDF generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#253A5C] mx-auto"></div>
          <p className="mt-4 text-[#253A5C]">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2">{error || 'Failed to load user data'}</p>
          <a href="/" className="mt-4 inline-block text-[#253A5C] hover:underline">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="sticky top-0 z-10">
        <Navbar
          data={{
            lastlastUpdated: userData.lastUpdated || 'Unknown',
            conversationCount: userData.conversationCount || 0,
          }}
          usersList={usersList}  // Pass the users list to Navbar
        />

        {/* Tab Bar - Updated to match Safari style */}
        <div className="bg-[#253A5C] h-10 flex items-center justify-between">
          <div className="flex items-center text-white h-full overflow-x-scroll">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-6 h-full font-medium flex items-center justify-center min-w-[200px] ${activeTab === 'analysis'
                  ? 'bg-[#3A5B85]'
                  : 'text-gray-200 hover:bg-[#304b70]'
                }`}
            >
              Analysis
            </button>
            {/* Taller separator */}
            <div className="h-10 w-0.5 bg-gray-400"></div>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 h-full font-medium flex items-center justify-center min-w-[120px] ${activeTab === 'chat'
                  ? 'bg-[#3A5B85]'
                  : 'text-gray-200 hover:bg-[#304b70]'
                }`}
            >
              Chat History
            </button>
          </div>

          <Button
            variant="contained"
            sx={{
              backgroundColor: '#3A5B85',
              '&:hover': { backgroundColor: '#304b70' },
              height: '36px',
              paddingInline: '24px',
            }}
            startIcon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </header>

      <main>
        {activeTab === 'analysis' ? (
          <div ref={gridRef}>
            <Grid>
              <ExecutiveSummary data={userData.executiveSummary} />
              <RadStageAssessment data={userData.radicalizationStage} />
              <RiskAssessment data={{ riskLevel: userData.executiveSummary?.riskLevel, riskFactors: userData.riskFactors }} />
              <InterventionEffectiveness data={userData.interventionEffectiveness} />
              <KeyInflectionPoints data={userData.inflectionPoints} />
              <UnmetPsycNeeds data={userData.psychologicalNeeds} />
              <EmotionalIcebergAnalysis data={userData.emotionalState} />
              <RecommendedApproaches data={userData.recommendedApproaches} />
            </Grid>
          </div>
        ) : (
          <div className="container mx-auto p-4">
            <ChatHistory data={userData.conversation || []} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Page;