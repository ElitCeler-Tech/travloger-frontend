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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Main Website Edit</h1>
          <p className="text-gray-500 text-sm mt-1">Edit content for the main travloger.in website pages</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-slate-800 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 disabled:opacity-50 text-sm font-semibold transition-colors"
        >
          {saving ? 'Saving...' : 'Save Page'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      {/* Page Selector */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Select Page</label>
        <div className="flex gap-2">
          {PAGES.map(page => (
            <button
              key={page}
              onClick={() => setSelectedPage(page)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                selectedPage === page
                  ? 'bg-slate-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto"></div>
          <p className="text-gray-400 text-sm mt-3">Loading content...</p>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">Hero Section</h2>
              <p className="text-xs text-gray-400 mt-0.5">Main banner area of the page</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={hero.title || ''}
                    onChange={e => setHero({ ...hero, title: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-800 focus:outline-none text-black"
                    placeholder="Page title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtitle</label>
                  <input
                    type="text"
                    value={hero.subtitle || ''}
                    onChange={e => setHero({ ...hero, subtitle: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-800 focus:outline-none text-black"
                    placeholder="Page subtitle"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Background Image URL</label>
                  <input
                    type="text"
                    value={hero.backgroundImageUrl || ''}
                    onChange={e => setHero({ ...hero, backgroundImageUrl: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-800 focus:outline-none text-black"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-gray-900">Content Sections</h2>
                <p className="text-xs text-gray-400 mt-0.5">{sections.length} section{sections.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={addSection}
                className="bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 text-xs font-semibold transition-colors"
              >
                + Add Section
              </button>
            </div>

            <div className="p-6">
              {sections.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No sections yet</p>
                  <p className="text-gray-400 text-xs mt-1">Click &quot;+ Add Section&quot; to start building content</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center text-xs font-bold text-slate-600">{index + 1}</span>
                          <span className="text-sm font-medium text-gray-700">{section.title || 'Untitled Section'}</span>
                        </div>
                        <button
                          onClick={() => removeSection(index)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                          <input
                            type="text"
                            value={section.title || ''}
                            onChange={e => updateSection(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-800 focus:outline-none text-black"
                            placeholder="Section title"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
                          <input
                            type="text"
                            value={section.imageUrl || ''}
                            onChange={e => updateSection(index, 'imageUrl', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-800 focus:outline-none text-black"
                            placeholder="https://..."
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Content</label>
                          <textarea
                            value={section.content || ''}
                            onChange={e => updateSection(index, 'content', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-800 focus:outline-none text-black resize-none"
                            placeholder="Section content..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MainWebsiteEdit
