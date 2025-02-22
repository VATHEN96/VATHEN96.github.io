import { Users, ThumbsUp, MessageSquare } from 'lucide-react'

export default function Community() {
  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Community-Driven Platform</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-purple-500" />
            <h3 className="text-xl font-semibold mb-2">Stakeholder Voting</h3>
            <p className="text-gray-400">Community members vote on campaign milestones and authenticity.</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <ThumbsUp className="w-12 h-12 mx-auto mb-4 text-purple-500" />
            <h3 className="text-xl font-semibold mb-2">Fair Exposure</h3>
            <p className="text-gray-400">Randomized campaign display ensures equal visibility for all projects.</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-purple-500" />
            <h3 className="text-xl font-semibold mb-2">Transparent Feedback</h3>
            <p className="text-gray-400">Open review system for campaigns to build trust and credibility.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

