import React from 'react'

interface Link {
  title: string
  url: string
  logo: string
}

interface Group {
  group: string
  links: Link[]
}

interface DashboardProps {
  data: Group[]
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  return (
    <div className="flex flex-col md:flex-row h-full">
      {data.map((group: Group) => (
        <div key={group.group} className="w-full md:w-1/2 lg:w-1/4 p-4">
          <h2 className="text-xl font-bold mb-2 text-white">{group.group}</h2>
          {group.links.map((link: Link) => {
            return (
              <a
                key={link.title}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-black/50 rounded-md p-4 mb-2 border border-gray-700 hover:bg-black/40 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <img src={link.logo} alt={`${link.title} Logo`} className="w-6 h-6 mr-2" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{link.title}</h3>
                    <p className="text-sm text-gray-400">{link.url}</p>
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

export default Dashboard
