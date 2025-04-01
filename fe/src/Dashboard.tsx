// Import React library
import React from 'react'

// Interface defining the structure of a Link object
interface Link {
  id: string
  title: string
  link: string
  imageurl: string
  notes: string
}

// Interface defining the structure of a Group object, which contains multiple links
interface Group {
  id: string
  title: string
  links: Link[]
}

// Props interface for the Dashboard component
interface DashboardProps {
  data: Group[] // Array of groups passed into the dashboard
}

// Dashboard component: displays groups and their associated links in a grid layout
const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  return (
    // Main container with responsive layout: column on small screens, row on larger screens
    <div className="flex flex-col md:flex-row h-full pt-5">
      {/* Iterate through each group and render its content */}
      {data.map((group: Group) => (
        <div
          key={group.id}
          className="w-full md:w-1/2 lg:w-1/4 p-4 bg-black/60 ml-2 mr-2 mt-12 rounded-lg"
        >
          {/* Group title */}
          <h2 className="text-xl font-bold mb-2 text-white">{group.title}</h2>

          {/* Iterate through each link within the group */}
          {group.links?.map((link: Link) => {
            return (
              // Each link is rendered as a styled anchor tag
              <a
                key={link.id}
                href={link.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block gradient rounded-md p-4 mb-2 border border-gray-700 hover:bg-black/40 transition-colors duration-200"
              >
                {/* Layout for link preview: image and text side-by-side */}
                <div className="flex">
                  {/* Display the logo/image of the link */}
                  <img
                    src={`/uploads/` + link.imageurl}
                    alt={`${link.title} Logo`}
                    className="h-auto max-h-12 max-w-12 object-contain mr-2"
                  />
                  {/* Link details: title, URL, and notes */}
                  <div>
                    <h3 className="text-lg font-semibold text-white">{link.title}</h3>
                    <p className="text-sm text-gray-400">{link.link}</p>

                    {/* Render notes as HTML if available */}
                    {link.notes && (
                      <div
                        className="mt-2 text-sm text-gray-400"
                        dangerouslySetInnerHTML={{ __html: link.notes }}
                      />
                    )}
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// Export the Dashboard component as default
export default Dashboard
