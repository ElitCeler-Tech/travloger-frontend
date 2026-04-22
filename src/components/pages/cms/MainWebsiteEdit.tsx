import React, { useState, useEffect } from 'react'
import { fetchApi, handleApiError } from '../../../lib/api'

const PAGES = ['home', 'about', 'contact', 'privacy', 'terms']

const MainWebsiteEdit: React.FC = () => {
  const [selectedPage, setSelectedPage] = useState<string>('home')
  const [hero, setHero] = useState<any>({ title: '', subtitle: '', backgroundImageUrl: '' })
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchApi(`/api/cms/site/${selectedPage}`)
        setHero(data.hero || { title: '', subtitle: '', backgroundImageUrl: '' })
        setSections(data.sections || [])
      } catch (e) {
        setError(handleApiError(e))
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [selectedPage])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await fetchApi(`/api/cms/site/${selectedPage}`, {
        method: 'PUT',
        body: JSON.stringify({ hero, sections })
      })
      alert(`${selectedPage} page saved successfully`)
    } catch (e) {
      setError(handleApiError(e))
    } finally {
      setSaving(false)
    }
  }

  const addSection = () => {
    setSections([...sections, { title: '', content: '', imageUrl: '' }])
  }

  const updateSection = (index: number, field: string, value: string) => {
    const updated = [...sections]
    updated[index] = { ...updated[index], [field]: value }
    setSections(updated)
  }

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Main Website Edit</h1>
          <p className="text-gray-600 text-sm">Edit content for the main travloger.in website pages</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          {saving ? 'Saving...' : 'Save Page'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      {/* Page Selector */}
      <div className="bg-white shadow rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Page</label>
        <div className="flex gap-2">
          {PAGES.map(page => (
            <button
              key={page}
              onClick={() => setSelectedPage(page)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                selectedPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          {/* Hero Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hero Section</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={hero.title || ''}
                  onChange={e => setHero({ ...hero, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Page title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={hero.subtitle || ''}
                  onChange={e => setHero({ ...hero, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Page subtitle"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
                <input
                  type="text"
                  value={hero.backgroundImageUrl || ''}
                  onChange={e => setHero({ ...hero, backgroundImageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Content Sections</h2>
              <button
                onClick={addSection}
                className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 text-sm font-medium"
              >
                + Add Section
              </button>
            </div>

            {sections.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No sections yet. Click &quot;Add Section&quot; to start.</p>
            ) : (
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-600">Section {index + 1}</span>
                      <button
                        onClick={() => removeSection(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                        <input
                          type="text"
                          value={section.title || ''}
                          onChange={e => updateSection(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="Section title"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                        <input
                          type="text"
                          value={section.imageUrl || ''}
                          onChange={e => updateSection(index, 'imageUrl', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
                        <textarea
                          value={section.content || ''}
                          onChange={e => updateSection(index, 'content', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="Section content..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default MainWebsiteEdit
