import React, { useState, useEffect, useCallback } from 'react'
import { fetchApi, handleApiError } from '../../../lib/api'

const PAGES = ['home', 'about', 'contact', 'privacy', 'terms']

interface Package {
  id: number
  name: string
  destination: string
  duration: string
  price: number | string
  original_price?: number
  image?: string
  status: string
  featured: boolean
  trip_type?: string
  nights?: number
  days?: number
}

const MainWebsiteEdit: React.FC = () => {
  const [selectedPage, setSelectedPage] = useState<string>('home')
  const [hero, setHero] = useState<any>({ title: '', subtitle: '', backgroundImageUrl: '' })
  const [sections, setSections] = useState<any[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [packagesLoading, setPackagesLoading] = useState(false)

  // Fetch page content
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

  // Fetch packages
  const fetchPackages = useCallback(async () => {
    setPackagesLoading(true)
    try {
      const data = await fetchApi('/api/packages')
      setPackages(data.packages || [])
    } catch (e) {
      console.error('Failed to load packages:', e)
    } finally {
      setPackagesLoading(false)
    }
  }, [])

  useEffect(() => { fetchPackages() }, [fetchPackages])

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

  const toggleFeatured = async (pkg: Package) => {
    try {
      await fetchApi(`/api/packages/${pkg.id}`, {
        method: 'PUT',
        body: JSON.stringify({ featured: !pkg.featured })
      })
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, featured: !p.featured } : p))
    } catch (e) {
      alert('Failed to update package')
    }
  }

  const toggleStatus = async (pkg: Package) => {
    const newStatus = pkg.status === 'Active' ? 'Inactive' : 'Active'
    try {
      await fetchApi(`/api/packages/${pkg.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      })
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, status: newStatus } : p))
    } catch (e) {
      alert('Failed to update package')
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
          <p className="text-gray-500 text-sm mt-1">Manage content & packages for travloger.in</p>
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

      {/* Packages Section - Shows packages from DB */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">Packages on Main Website</h2>
            <p className="text-xs text-gray-400 mt-0.5">Toggle featured/active to control what shows on travloger.in · {packages.filter(p => p.featured).length} featured, {packages.filter(p => p.status === 'Active').length} active</p>
          </div>
          <button onClick={fetchPackages} className="text-xs text-slate-600 hover:text-slate-800 font-medium">↻ Refresh</button>
        </div>
        <div className="p-6">
          {packagesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800 mx-auto"></div>
              <p className="text-gray-400 text-xs mt-2">Loading packages...</p>
            </div>
          ) : packages.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No packages found. Create packages in the Itinerary Builder first.</p>
          ) : (
            <div className="space-y-2">
              {packages.map(pkg => (
                <div key={pkg.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-3">
                    {pkg.image && (
                      <div className="w-12 h-8 rounded overflow-hidden bg-gray-100 shrink-0">
                        <img src={pkg.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                      <div className="text-xs text-gray-400">{pkg.destination} · {pkg.nights || 0}N/{pkg.days || 0}D · ₹{pkg.price}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Featured toggle */}
                    <button
                      onClick={() => toggleFeatured(pkg)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        pkg.featured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {pkg.featured ? '★ Featured' : '☆ Feature'}
                    </button>
                    {/* Active toggle */}
                    <button
                      onClick={() => toggleStatus(pkg)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        pkg.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {pkg.status === 'Active' ? '● Active' : '○ Inactive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Page Content Editor */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Page Content</label>
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
              <p className="text-xs text-gray-400 mt-0.5">Main banner for the {selectedPage} page</p>
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
                <p className="text-gray-400 text-sm text-center py-8">No sections yet. Click &quot;+ Add Section&quot; to start.</p>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center text-xs font-bold text-slate-600">{index + 1}</span>
                          <span className="text-sm font-medium text-gray-700">{section.title || 'Untitled'}</span>
                        </div>
                        <button onClick={() => removeSection(index)} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                          <input type="text" value={section.title || ''} onChange={e => updateSection(index, 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-800 focus:outline-none text-black" placeholder="Section title" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
                          <input type="text" value={section.imageUrl || ''} onChange={e => updateSection(index, 'imageUrl', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-800 focus:outline-none text-black" placeholder="https://..." />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Content</label>
                          <textarea value={section.content || ''} onChange={e => updateSection(index, 'content', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-800 focus:outline-none text-black resize-none" placeholder="Section content..." />
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
