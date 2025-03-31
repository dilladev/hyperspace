import React from 'react'

interface Link {
  id: string
  title: string
  link: string
  imageurl: string
  notes: string
}

interface Group {
  id: string
  title: string
  links: Link[]
}

interface DashboardProps {
  data: Group[]
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  return (
    <div className="flex flex-col md:flex-row h-full pt-5">
      {data.map((group: Group) => (
        <div key={group.id} className="w-full md:w-1/2 lg:w-1/4 p-4 bg-black/60 ml-2 mr-2 mt-12 rounded-lg">
          <h2 className="text-xl font-bold mb-2 text-white">{group.title}</h2>
          {group.links?.map((link: Link) => {
            return (
              <a
                key={link.id}
                href={link.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block gradient rounded-md p-4 mb-2 border border-gray-700 hover:bg-black/40 transition-colors duration-200"
              >
                <div className="flex">
                  <img src={`/uploads/` + link.imageurl} alt={`${link.title} Logo`} className="h-auto max-h-12 object-contain mr-2" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{link.title}</h3>
                    <p className="text-sm text-gray-400">{link.link}</p>
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

export default Dashboard
