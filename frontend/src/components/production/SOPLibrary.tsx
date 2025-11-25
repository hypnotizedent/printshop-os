import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MagnifyingGlass, Star, Book, Wrench, FirstAidKit, Warning, Plus } from "@phosphor-icons/react"
import { SOPViewer } from "./SOPViewer"
import { SOPEditor } from "./SOPEditor"
import { SOPSearch } from "./SOPSearch"
import { SOPCategories } from "./SOPCategories"

export interface SOP {
  id: string
  title: string
  slug: string
  category: 'Machines' | 'Processes' | 'Troubleshooting' | 'Safety'
  subcategory?: string
  tags: string[]
  summary: string
  content: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  estimatedTime: number
  viewCount: number
  version: number
  updatedAt: string
  isFavorite?: boolean
}

interface SOPLibraryProps {
  onNavigate?: (page: string) => void
}

export function SOPLibrary({ onNavigate }: SOPLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [sops, setSOPs] = useState<SOP[]>([])
  const [favorites, setFavorites] = useState<SOP[]>([])
  const [mostViewed, setMostViewed] = useState<SOP[]>([])

  useEffect(() => {
    // Fetch SOPs from API
    fetchSOPs()
    fetchFavorites()
    fetchMostViewed()
  }, [])

  const fetchSOPs = async () => {
    // TODO: Replace with actual API call
    // const response = await fetch('/api/production/sops')
    // const data = await response.json()
    // setSOPs(data.sops)
    
    // Mock data for now
    setSOPs([
      {
        id: '1',
        title: 'Screen Press Setup',
        slug: 'screen-press-setup',
        category: 'Machines',
        subcategory: 'Screen Printing',
        tags: ['screen', 'printing', 'setup', 'press'],
        summary: 'Complete setup procedure for manual and automatic screen printing presses.',
        content: 'Step-by-step guide...',
        difficulty: 'Intermediate',
        estimatedTime: 30,
        viewCount: 124,
        version: 3.2,
        updatedAt: '2025-11-15',
        isFavorite: true,
      },
      {
        id: '2',
        title: 'Fixing Registration Issues',
        slug: 'fixing-registration-issues',
        category: 'Troubleshooting',
        subcategory: 'Screen Issues',
        tags: ['registration', 'troubleshooting', 'screen'],
        summary: 'Step-by-step guide to diagnose and fix registration problems on screen press.',
        content: 'Troubleshooting steps...',
        difficulty: 'Advanced',
        estimatedTime: 45,
        viewCount: 89,
        version: 2.1,
        updatedAt: '2025-11-10',
      },
      {
        id: '3',
        title: 'DTG Pre-treatment Guide',
        slug: 'dtg-pre-treatment-guide',
        category: 'Processes',
        subcategory: 'Pre-treatment',
        tags: ['dtg', 'pre-treatment', 'process'],
        summary: 'Complete guide for pre-treating garments for DTG printing.',
        content: 'Pre-treatment process...',
        difficulty: 'Beginner',
        estimatedTime: 15,
        viewCount: 67,
        version: 1.5,
        updatedAt: '2025-11-08',
      },
    ])
  }

  const fetchFavorites = async () => {
    // TODO: Replace with actual API call
    // Filter favorites from SOPs
    setFavorites(sops.filter(sop => sop.isFavorite))
  }

  const fetchMostViewed = async () => {
    // TODO: Replace with actual API call
    // Sort by viewCount
    const sorted = [...sops].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5)
    setMostViewed(sorted)
  }

  useEffect(() => {
    fetchFavorites()
    fetchMostViewed()
  }, [sops])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category)
  }

  const handleSOPSelect = (sop: SOP) => {
    setSelectedSOP(sop)
    setIsEditing(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCreate = () => {
    setSelectedSOP(null)
    setIsCreating(true)
  }

  const handleSave = (sop: SOP) => {
    // TODO: Save to API
    setSOPs(prev => {
      const existing = prev.find(s => s.id === sop.id)
      if (existing) {
        return prev.map(s => s.id === sop.id ? sop : s)
      }
      return [...prev, sop]
    })
    setIsEditing(false)
    setIsCreating(false)
    setSelectedSOP(sop)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setIsCreating(false)
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      Machines: <Wrench size={20} weight="fill" />,
      Processes: <Book size={20} weight="fill" />,
      Troubleshooting: <FirstAidKit size={20} weight="fill" />,
      Safety: <Warning size={20} weight="fill" />,
    }
    return icons[category as keyof typeof icons] || <Book size={20} weight="fill" />
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      Beginner: 'bg-green-600/20 text-green-600 border-green-600/30',
      Intermediate: 'bg-yellow/20 text-yellow border-yellow/30',
      Advanced: 'bg-destructive/20 text-destructive border-destructive/30',
    }
    return colors[difficulty as keyof typeof colors] || 'bg-muted text-foreground'
  }

  const filteredSOPs = sops.filter(sop => {
    const matchesSearch = !searchQuery || 
      sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = !selectedCategory || sop.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  if (selectedSOP && !isEditing && !isCreating) {
    return (
      <SOPViewer 
        sop={selectedSOP} 
        onBack={() => setSelectedSOP(null)}
        onEdit={handleEdit}
      />
    )
  }

  if ((isEditing || isCreating) && (selectedSOP || isCreating)) {
    return (
      <SOPEditor
        sop={isEditing ? selectedSOP || undefined : undefined}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">SOP Library</h1>
          <p className="text-muted-foreground mt-1">Standard Operating Procedures & Documentation</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={18} weight="bold" />
          New SOP
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search SOPs by title, tags, or content..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Access - Favorites */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star size={18} weight="fill" className="text-yellow" />
              <h3 className="font-semibold text-foreground">Favorites</h3>
            </div>
            <div className="space-y-2">
              {favorites.length === 0 ? (
                <p className="text-sm text-muted-foreground">No favorites yet</p>
              ) : (
                favorites.map(sop => (
                  <button
                    key={sop.id}
                    onClick={() => handleSOPSelect(sop)}
                    className="w-full text-left text-sm text-foreground hover:text-primary transition-colors"
                  >
                    {sop.title}
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Categories */}
          <SOPCategories
            sops={sops}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
          />

          {/* Most Viewed */}
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Most Viewed</h3>
            <div className="space-y-3">
              {mostViewed.map((sop, index) => (
                <button
                  key={sop.id}
                  onClick={() => handleSOPSelect(sop)}
                  className="w-full text-left group"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-muted-foreground mt-0.5">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {sop.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{sop.viewCount} views</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All SOPs ({filteredSOPs.length})</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {filteredSOPs.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No SOPs found</p>
                </Card>
              ) : (
                filteredSOPs.map(sop => (
                  <Card 
                    key={sop.id}
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleSOPSelect(sop)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getCategoryIcon(sop.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{sop.title}</h3>
                              {sop.isFavorite && (
                                <Star size={16} weight="fill" className="text-yellow" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{sop.summary}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {sop.category}
                          </Badge>
                          {sop.subcategory && (
                            <Badge variant="outline" className="text-xs">
                              {sop.subcategory}
                            </Badge>
                          )}
                          <Badge variant="outline" className={getDifficultyColor(sop.difficulty) + " text-xs"}>
                            {sop.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {sop.estimatedTime} min
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {sop.viewCount} views
                          </span>
                          <span className="text-xs text-muted-foreground">
                            v{sop.version}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="recent" className="space-y-3">
              {[...filteredSOPs]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 10)
                .map(sop => (
                  <Card 
                    key={sop.id}
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleSOPSelect(sop)}
                  >
                    <h3 className="font-semibold text-foreground mb-1">{sop.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Updated {new Date(sop.updatedAt).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="popular" className="space-y-3">
              {[...filteredSOPs]
                .sort((a, b) => b.viewCount - a.viewCount)
                .slice(0, 10)
                .map(sop => (
                  <Card 
                    key={sop.id}
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleSOPSelect(sop)}
                  >
                    <h3 className="font-semibold text-foreground mb-1">{sop.title}</h3>
                    <p className="text-sm text-muted-foreground">{sop.viewCount} views</p>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
