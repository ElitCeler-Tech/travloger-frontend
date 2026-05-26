'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Image from 'next/image'
import { fetchApi, handleApiError } from '../../../lib/api'

interface TrustIndicator {
  rating: string
  label: string
  url?: string
}

interface HeroContent {
  title: string
  subtitle: string
  highlightText?: string
  backgroundImageUrl: string
  mobileBackgroundImageUrl?: string
  mobileVideoUrl: string
  desktopVideoUrl?: string
  whatsappPhone: string
  whatsappMessage: string
  trustIndicators?: {
    google: TrustIndicator
    payLater: TrustIndicator
    instagram: TrustIndicator
  }
}

const DEFAULT_TRUST_INDICATORS = {
  google: { rating: '4.9', label: 'Ratings' },
  payLater: { rating: 'Pay Later', label: 'Flexible' },
  instagram: { rating: '5K+', label: 'Followers', url: '' }
}

interface TripDay {
  day: number
  title: string
  description: string
}

interface FeatureTag {
  name: string
  icon: 'default' | 'flights' | 'bus' | 'train'
  included: boolean
}

interface TripOption {
  id: string
  title: string
  description: string
  image: string
  nights: number
  days: number
  price: string | number
  category: 'custom' | 'group'
  route?: string
  trending?: boolean
  detailedItinerary?: {
    subtitle: string
    headerImage?: string
    briefItinerary: TripDay[]
    keyAttractions: string[]
    inclusions: string[]
    showInclusions?: boolean
  }
  features?: FeatureTag[]
}

interface TripOptionsContent {
  heading: string
  subheading: string
  highlightText?: string
  customLabel: string
  groupLabel: string
  customTrips: TripOption[]
  groupTrips: TripOption[]
}

interface HeaderContent {
  navItems: { label: string; href: string }[]
  enquireLabel: string
  callNumber: string
}

interface ReviewsContent {
  heading: string
  subheading: string
  reviews: {
    id: string
    name: string
    review: string
    images: {
      src: string
      alt: string
    }[]
  }[]
}

interface BrandsContent {
  heading: string
  subheading: string
  scrollDuration?: number
  brands: {
    id: string
    name: string
    logoUrl: string
    width?: number
    height?: number
  }[]
}

interface FAQContent {
  heading: string
  items: {
    id: string
    question: string
    answer: string
  }[]
}

interface USPContent {
  heading: string
  subheading?: string
  ctaText?: string
  items: {
    id: string
    title: string
    description: string
  }[]
}

interface HighlightImage {
  id: string
  src: string
  alt: string
}

interface TripHighlightsContent {
  heading: string
  subheading: string
  highlights: HighlightImage[]
}

interface GroupCTAContent {
  heading: string
  subtext: string
  buttonLabel: string
  backgroundImageUrl: string
}

interface AccommodationContent {
  heading: string
  stockImage: string
  realImage: string
  promiseText?: string
  getText?: string
}

// Removed advanced sections (USP, FAQ, GroupCTA) from editor to reduce confusion

/** Enquiry form header image ratios (width:height) for tooltips */
const ENQUIRY_FORM_IMAGE_RATIO_DESKTOP = '3:1'
const ENQUIRY_FORM_IMAGE_RATIO_MOBILE = '1:1'
const ENQUIRY_FORM_IMAGE_TOOLTIP_DESKTOP = `Recommended ratio: ${ENQUIRY_FORM_IMAGE_RATIO_DESKTOP} (e.g. 1200×400 px)`
const ENQUIRY_FORM_IMAGE_TOOLTIP_MOBILE = `Recommended ratio: ${ENQUIRY_FORM_IMAGE_RATIO_MOBILE} (e.g. 600×600 px)`

interface ContactContent {
  email: string
  phone: string
  address: string
  formBackgroundImageUrl?: string
  formBackgroundImageUrlMobile?: string
  formTitle?: string
  formSubtitle?: string
  formButtonText?: string
  whatsapp?: string
  expertButtonText?: string
  twitterUrl?: string
  facebookUrl?: string
  instagramUrl?: string
  youtubeUrl?: string
}

// Itinerary (Packages) types reused here in a simplified way
interface ItineraryPackage {
  id: number
  name: string
  destination: string
  duration: string
  price: string | number
  original_price: number
  description: string
  highlights: string[]
  includes: string[]
  category: string
  status: 'Active' | 'Inactive' | 'Draft'
  featured: boolean
  image?: string
  route?: string
  nights?: number
  days?: number
  trip_type?: 'custom' | 'group'
  created_at?: string
  bookings?: number
}

interface NewItineraryForm {
  name: string
  destination: string
  duration: string
  price: string | number
  originalPrice: number
  description: string
  highlights: string
  includes: string
  category: string
  featured: boolean
  route?: string
  nights?: number
  days?: number
  tripType?: 'custom' | 'group'
}

type CitySlug = string

const FALLBACK_LOCATIONS: { slug: string; name: string }[] = [
  { slug: 'kashmir', name: 'Kashmir' },
  { slug: 'ladakh', name: 'Ladakh' },
  { slug: 'gokarna', name: 'Gokarna' },
  { slug: 'kerala', name: 'Kerala' },
  { slug: 'meghalaya', name: 'Meghalaya' },
  { slug: 'mysore', name: 'Mysore' },
  { slug: 'singapore', name: 'Singapore' },
  { slug: 'hyderabad', name: 'Hyderabad' },
  { slug: 'bengaluru', name: 'Bengaluru' },
  { slug: 'manali', name: 'Manali' }
]

const WebsiteEdit: React.FC = () => {
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filteredSections, setFilteredSections] = useState<string[]>([])
  // Hero thumbnails per location for the location cards grid
  const [heroThumbs, setHeroThumbs] = useState<Record<string, string>>({})
  const thumbsLoadedRef = useRef<boolean>(false)

  // Dynamic locations from API
  const [locations, setLocations] = useState<{ slug: string; name: string; updated_at?: string }[]>(FALLBACK_LOCATIONS)

  // Search & date filter for location cards
  const [cmsSearch, setCmsSearch] = useState('')
  const [cmsDateFilter, setCmsDateFilter] = useState<'all' | '7d' | '30d' | '90d'>('all')

  // Duplicate modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateSource, setDuplicateSource] = useState('')
  const [duplicateName, setDuplicateName] = useState('')
  const [duplicateSlug, setDuplicateSlug] = useState('')
  const [duplicating, setDuplicating] = useState(false)
  const [duplicateError, setDuplicateError] = useState('')

  // Rename modal state
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameSource, setRenameSource] = useState('')
  const [renameName, setRenameName] = useState('')
  const [renameSlug, setRenameSlug] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameError, setRenameError] = useState('')

  // Selected city (none at first → show location cards)
  const [citySlug, setCitySlug] = useState<CitySlug | ''>('')

  // Fetch city list from API
  const loadCities = useCallback(async () => {
    try {
      const data = await fetchApi('/api/cms/cities')
      if (data?.cities?.length) setLocations(data.cities)
    } catch { /* use fallback */ }
  }, [])

  useEffect(() => { if (!citySlug) loadCities() }, [citySlug, loadCities])

  // Search functionality
  useEffect(() => {
    const handleSearch = (event: any) => {
      const query = event.detail.toLowerCase()
      setSearchQuery(query)

      if (!query) {
        setFilteredSections([])
        return
      }

      const sections = [
        'header', 'hero', 'trip options', 'reviews', 'usp', 'brands', 'faq', 'trip highlights', 'group cta'
      ]

      const filtered = sections.filter(section =>
        section.toLowerCase().includes(query)
      )

      setFilteredSections(filtered)
    }

    window.addEventListener('searchQuery', handleSearch)
    return () => window.removeEventListener('searchQuery', handleSearch)
  }, [])

  // Hero section
  const [hero, setHero] = useState<HeroContent>({
    title: 'Discover Your Next Adventure',
    subtitle: 'Curated experiences across the globe',
    backgroundImageUrl: '',
    mobileBackgroundImageUrl: '',
    mobileVideoUrl: '',
    desktopVideoUrl: '',
    whatsappPhone: '+919876543210',
    whatsappMessage: 'Hi! I am interested in your tour packages. Can you help me plan my trip?',
    trustIndicators: DEFAULT_TRUST_INDICATORS
  })




  const [contact, setContact] = useState<ContactContent>({
    email: 'info@example.com',
    phone: '+1 555-0100',
    address: '123 Main St, City, Country',
    formBackgroundImageUrl: '',
    formBackgroundImageUrlMobile: ''
  })

  const [footerLocations, setFooterLocations] = useState<{ enabled: boolean; indian: { name: string; image: string; enabled: boolean }[]; international: { name: string; image: string; enabled: boolean }[] }>({
    enabled: true,
    indian: [
      { name: 'HAMPI', image: '/footerImages/hampi.png', enabled: true },
      { name: 'MANALI', image: '/footerImages/manali.png', enabled: true },
      { name: 'GOA', image: '/footerImages/goa.png', enabled: true },
      { name: 'KASHMIR', image: '/footerImages/kashmir.png', enabled: true },
      { name: 'RAJASTHAN', image: '/footerImages/rajasthan.png', enabled: true },
      { name: 'SIKKIM', image: '/footerImages/sikkim.png', enabled: true },
      { name: 'GUJRAT', image: '/footerImages/gujrat.png', enabled: true },
    ],
    international: [
      { name: 'THAILAND', image: '/footerImages/thailand.png', enabled: true },
      { name: 'JAPAN', image: '/footerImages/japan.png', enabled: true },
      { name: 'CHINA', image: '/footerImages/china.png', enabled: true },
      { name: 'BAKU', image: '/footerImages/baku.png', enabled: true },
      { name: 'PERU', image: '/footerImages/peru.png', enabled: true },
      { name: 'KOREA', image: '/footerImages/korea.png', enabled: true },
      { name: 'VIETNAM', image: '/footerImages/vietnam.png', enabled: true },
    ],
  })

  const [accommodation, setAccommodation] = useState<AccommodationContent>({
    heading: "What You See Is Where You'll Stay. Literally.",
    stockImage: '',
    realImage: '',
    promiseText: 'What they promise',
    getText: 'What you get'
  })

  const [header, setHeader] = useState<HeaderContent>({
    navItems: [
      { label: 'Plan my trip', href: '#packages' },
      { label: 'Stays', href: '#accommodation' },
      { label: 'Highlights', href: '#highlights' }
    ],
    enquireLabel: 'Enquire now',
    callNumber: '+919876543210'
  })

  const [reviews, setReviews] = useState<ReviewsContent>({
    heading: 'Unfiltered Reviews',
    subheading: 'Real experiences from real travelers - authentic stories from Kashmir',
    reviews: [
      {
        id: '1',
        name: 'Aarav & Meera Sharma',
        review: 'Our Kashmir honeymoon package trip with WanderOn was pure magic! From the cozy houseboat stay in Srinagar to the breathtaking views of Gulmarg, everything was perfectly arranged.',
        images: [
          { src: '/Reviews/1.jpg', alt: 'A group of friends enjoying a boat ride on a serene lake.' },
          { src: '/Reviews/2.jpg', alt: 'A stunning view of a calm lake with snow-capped mountains in the background.' }
        ]
      },
      {
        id: '2',
        name: 'Rohan Sharma',
        review: 'An absolutely mesmerizing experience with WanderOn! The beauty of Kashmir is unparalleled, and the trip was organized flawlessly.',
        images: [
          { src: '/Reviews/3.jpg', alt: 'A vibrant, colorful boat docked on the shore of a lake.' },
          { src: '/Reviews/4.jpg', alt: 'A picturesque landscape of a river flowing through a lush green valley.' }
        ]
      }
    ]
  })

  const [brands, setBrands] = useState<BrandsContent>({
    heading: "Brands Who've Worked with Us",
    subheading: "Corporate clients who trust Travloger for their offsites & escapes",
    scrollDuration: 25,
    brands: []
  })

  const [faq, setFaq] = useState<FAQContent>({
    heading: "Before You Pack, Read This FAQs.",
    items: [
      {
        id: '1',
        question: "What's included in the Travlogers Kerala package?",
        answer: "Our Kerala package includes hotel stays, daily breakfast & dinner, private cab for sightseeing, and photography. Houseboat bookings, Ayurveda treatments, and adventure activities can be added as extras. You'll also get 24/7 trip support from our team."
      },
      {
        id: '2',
        question: "Is photography included in the group trip?",
        answer: "Yes, professional photography is included in all our Kerala group trips. Our experienced photographers will capture your best moments throughout the journey, including stunning backwaters, tea gardens, and cultural experiences, and you'll receive a curated collection of high-quality photos after the trip."
      },
      {
        id: '3',
        question: "How does the booking process work?",
        answer: "The booking process is simple: 1) Choose your preferred Kerala package and dates, 2) Pay a small booking amount to secure your spot, 3) Complete the remaining payment before the trip, 4) Receive your detailed itinerary and travel documents. Our team will guide you through each step."
      },
      {
        id: '4',
        question: "Will someone assist us during the trip?",
        answer: "Absolutely! You'll have a dedicated trip coordinator who will be available 24/7 throughout your Kerala journey. Additionally, our local guides will accompany you to all major attractions and provide insights about Kerala's culture, history, and hidden gems."
      },
      {
        id: '5',
        question: "Do you arrange adventure activities or surprises for couples?",
        answer: "Yes, we specialize in creating magical experiences in Kerala! We can arrange adventure activities like trekking, bamboo rafting, and spice plantation tours. For couples, we offer romantic surprises like candlelight dinners on houseboats, private Ayurveda sessions, and special photography sessions at scenic locations like Munnar tea gardens."
      }
    ]
  })

  const [selectedFaqItem, setSelectedFaqItem] = useState<string>('1')

  const [usp, setUsp] = useState<USPContent>({
    heading: 'Why Travloger is trusted by thousands?',
    subheading: '',
    ctaText: 'Ready to experience Kashmir like never before?',
    items: [
      {
        id: '1',
        title: 'Snap & Go',
        description: 'Photographer onboard - memories included! Every moment captured professionally.'
      },
      {
        id: '2',
        title: 'End-to-End Handling',
        description: 'From bookings to boarding, we handle everything. Just pack your bags and get ready for adventure.'
      },
      {
        id: '3',
        title: 'No Switch-Outs',
        description: 'What you see is what you get. No hidden surprises or last-minute changes to your itinerary.'
      },
      {
        id: '4',
        title: 'Locally Curated',
        description: 'Stays we\'ve slept in, not Googled. Every stay is personally tested and approved by our team.'
      }
    ]
  })

  const [tripHighlights, setTripHighlights] = useState<TripHighlightsContent>({
    heading: "Discover Hidden Gems",
    subheading: "Experience the most breathtaking destinations",
    highlights: []
  })

  const [groupCta, setGroupCta] = useState<GroupCTAContent>({
    heading: "Travelling with 8 or more ?",
    subtext: "Enjoy a free photographer on your trip or unlock up to 40% off as the trip planner.",
    buttonLabel: "Plan my trip",
    backgroundImageUrl: ""
  })

  const [selectedUspItem, setSelectedUspItem] = useState<string>('1')
  const [selectedHighlight, setSelectedHighlight] = useState<string>('')
  const [selectedReview, setSelectedReview] = useState<string>('')
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [selectedCustomTrip, setSelectedCustomTrip] = useState<string>('')
  const [selectedGroupTrip, setSelectedGroupTrip] = useState<string>('')

  // File upload states for brands
  const [brandImageFiles, setBrandImageFiles] = useState<{ [brandId: string]: File | null }>({})

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Itineraries legacy state to satisfy existing actions
  const [itLoading, setItLoading] = useState<boolean>(false)
  const [itError, setItError] = useState<string | null>(null)
  const [itineraries, setItineraries] = useState<ItineraryPackage[]>([])
  const [showCreateItModal, setShowCreateItModal] = useState<boolean>(false)
  const [newItImageFile, setNewItImageFile] = useState<File | null>(null)
  const [showEditItModal, setShowEditItModal] = useState<boolean>(false)
  const [editItId, setEditItId] = useState<number | null>(null)
  const [editItImageFile, setEditItImageFile] = useState<File | null>(null)

  const [tripOptions, setTripOptions] = useState<TripOptionsContent>({
    heading: 'How Do You Want To Explore? ',
    subheading: 'Choose your perfect adventure',
    customLabel: 'Custom Trip',
    groupLabel: 'Group Departure',
    customTrips: [
      {
        id: 'custom-1',
        title: 'Kerala Backwaters Bliss',
        description: 'Experience the serene backwaters of Kerala with traditional houseboat stays',
        image: '/cards/1.jpg',
        nights: 4,
        days: 5,
        price: '18,999/- Pp',
        category: 'custom',
        route: 'Kochi → Alleppey → Kumarakom',
        trending: true,
        detailedItinerary: {
          subtitle: 'Complete Travel Experience',
          briefItinerary: [
            {
              day: 1,
              title: 'Srinagar Arrival & Sightseeing',
              description: 'Arrive in Srinagar and explore the beautiful Mughal Gardens and Dal Lake'
            },
            {
              day: 2,
              title: 'Day Trip to Sonmarg – The Meadow of Gold',
              description: 'Visit the stunning meadows and glaciers of Sonmarg'
            },
            {
              day: 3,
              title: 'Day Trip to Gulmarg – The Meadow of Flowers',
              description: 'Experience the famous Gondola ride and enjoy the alpine meadows'
            },
            {
              day: 4,
              title: 'Day Trip to Doodhpathri & Houseboat Stay',
              description: 'Explore the beautiful meadows of Doodhpathri and stay in a traditional houseboat'
            },
            {
              day: 5,
              title: 'Srinagar to Pahalgam – Legendary countryside',
              description: 'Travel to Pahalgam and explore the legendary valleys and countryside'
            }
          ],
          keyAttractions: [
            'Mughal Gardens, Dal Lake',
            'Thajiwas Glacier & Zojila Pass in Sonmarg',
            'Gondola ride at Gulmarg (Asia\'s highest cable car)',
            'Doodhpathri meadows & pine forests',
            'Aru, Betaab & Chandanwari valleys in Pahalgam',
            'Boutique houseboat stay in Srinagar'
          ],
          inclusions: ['Sightseeing', 'Transfers', 'Meals', 'Stay', 'Trip Assistance']
        }
      }
    ],
    groupTrips: []
  })

  // Advanced sections removed from WebsiteEdit UI

  const cityName = useMemo(() => locations.find(l => l.slug === citySlug)?.name || '', [citySlug, locations])

  // Itinerary state (scoped to selected city)
  const navigate = useNavigate()

  const [newItinerary, setNewItinerary] = useState<NewItineraryForm>({
    name: '',
    destination: '',
    duration: '',
    price: '',
    originalPrice: 0,
    description: '',
    highlights: '',
    includes: '',
    category: 'Adventure',
    featured: false,
    route: '',
    nights: 0,
    days: 0,
    tripType: 'custom'
  })

  const [editItForm, setEditItForm] = useState<NewItineraryForm>({
    name: '',
    destination: '',
    duration: '',
    price: '',
    originalPrice: 0,
    description: '',
    highlights: '',
    includes: '',
    category: 'Adventure',
    featured: false,
    route: '',
    nights: 0,
    days: 0,
    tripType: 'custom'
  })

  useEffect(() => {
    if (!citySlug) return
    const loadInitial = async () => {
      try {
        const data = await fetchApi(`/api/cms/cities/${citySlug}`)
        console.log('Loaded data:', data) // Debug log
        const heroData = data.hero ?? {
          title: 'Discover Your Next Adventure',
          subtitle: 'Curated experiences across the globe',
          backgroundImageUrl: '',
          mobileBackgroundImageUrl: '',
          whatsappPhone: '+919876543210',
          whatsappMessage: 'Hi! I am interested in your tour packages. Can you help me plan my trip?'
        }
        setHero({
          ...heroData,
          mobileBackgroundImageUrl: heroData.mobileBackgroundImageUrl || '',
          mobileVideoUrl: heroData.mobileVideoUrl || '',
          desktopVideoUrl: heroData.desktopVideoUrl || '',
          trustIndicators: heroData.trustIndicators ?? DEFAULT_TRUST_INDICATORS
        })
        setHeader(data.header ?? {
          navItems: [
            { label: 'Plan my trip', href: '#packages' },
            { label: 'Stays', href: '#accommodation' },
            { label: 'Highlights', href: '#highlights' }
          ],
          enquireLabel: 'Enquire now',
          callNumber: '+919876543210'
        })
        setContact(data.contact ?? {
          email: 'info@example.com',
          phone: '+1 555-0100',
          address: '123 Main St, City, Country',
          formBackgroundImageUrl: '',
          formBackgroundImageUrlMobile: ''
        })
        setAccommodation(data.accommodation ?? {
          heading: "What You See Is Where You'll Stay. Literally.",
          stockImage: '',
          realImage: '',
          promiseText: 'What they promise',
          getText: 'What you get'
        })
        setReviews(data.reviews ?? {
          heading: 'Unfiltered Reviews',
          subheading: 'Real experiences from real travelers - authentic stories from Kashmir',
          reviews: [
            {
              id: '1',
              name: 'Aarav & Meera Sharma',
              review: 'Our Kashmir honeymoon package trip with WanderOn was pure magic! From the cozy houseboat stay in Srinagar to the breathtaking views of Gulmarg, everything was perfectly arranged.',
              images: [
                { src: '/Reviews/1.jpg', alt: 'A group of friends enjoying a boat ride on a serene lake.' },
                { src: '/Reviews/2.jpg', alt: 'A stunning view of a calm lake with snow-capped mountains in the background.' }
              ]
            },
            {
              id: '2',
              name: 'Rohan Sharma',
              review: 'An absolutely mesmerizing experience with WanderOn! The beauty of Kashmir is unparalleled, and the trip was organized flawlessly.',
              images: [
                { src: '/Reviews/3.jpg', alt: 'A vibrant, colorful boat docked on the shore of a lake.' },
                { src: '/Reviews/4.jpg', alt: 'A picturesque landscape of a river flowing through a lush green valley.' }
              ]
            }
          ]
        })
        // Default USP items
        const defaultUspItems = [
          {
            id: '1',
            title: 'Snap & Go',
            description: 'Photographer onboard - memories included! Every moment captured professionally.'
          },
          {
            id: '2',
            title: 'End-to-End Handling',
            description: 'From bookings to boarding, we handle everything. Just pack your bags and get ready for adventure.'
          },
          {
            id: '3',
            title: 'No Switch-Outs',
            description: 'What you see is what you get. No hidden surprises or last-minute changes to your itinerary.'
          },
          {
            id: '4',
            title: 'Locally Curated',
            description: 'Stays we\'ve slept in, not Googled. Every stay is personally tested and approved by our team.'
          }
        ]

        // Merge CMS data with defaults, ensuring we always have 4 items
        const mergedUspItems = defaultUspItems.map(defaultItem => {
          const cmsItem = data.usp?.items?.find((item: any) => item.id === defaultItem.id)
          return cmsItem || defaultItem
        })

        setUsp({
          heading: data.usp?.heading || 'Why Travloger is trusted by thousands?',
          subheading: data.usp?.subheading || '',
          ctaText: data.usp?.ctaText || 'Ready to experience Kashmir like never before?',
          items: mergedUspItems
        })
        setBrands(data.brands ?? {
          heading: "Brands Who've Worked with Us",
          subheading: "Corporate clients who trust Travloger for their offsites & escapes",
          brands: []
        })
        // Default FAQ items
        const defaultFaqItems = [
          {
            id: '1',
            question: "What's included in the Travlogers Kerala package?",
            answer: "Our Kerala package includes hotel stays, daily breakfast & dinner, private cab for sightseeing, and photography. Houseboat bookings, Ayurveda treatments, and adventure activities can be added as extras. You'll also get 24/7 trip support from our team."
          },
          {
            id: '2',
            question: "Is photography included in the group trip?",
            answer: "Yes, professional photography is included in all our Kerala group trips. Our experienced photographers will capture your best moments throughout the journey, including stunning backwaters, tea gardens, and cultural experiences, and you'll receive a curated collection of high-quality photos after the trip."
          },
          {
            id: '3',
            question: "How does the booking process work?",
            answer: "The booking process is simple: 1) Choose your preferred Kerala package and dates, 2) Pay a small booking amount to secure your spot, 3) Complete the remaining payment before the trip, 4) Receive your detailed itinerary and travel documents. Our team will guide you through each step."
          },
          {
            id: '4',
            question: "Will someone assist us during the trip?",
            answer: "Absolutely! You'll have a dedicated trip coordinator who will be available 24/7 throughout your Kerala journey. Additionally, our local guides will accompany you to all major attractions and provide insights about Kerala's culture, history, and hidden gems."
          },
          {
            id: '5',
            question: "Do you arrange adventure activities or surprises for couples?",
            answer: "Yes, we specialize in creating magical experiences in Kerala! We can arrange adventure activities like trekking, bamboo rafting, and spice plantation tours. For couples, we offer romantic surprises like candlelight dinners on houseboats, private Ayurveda sessions, and special photography sessions at scenic locations like Munnar tea gardens."
          }
        ]

        // Merge CMS data with defaults, ensuring we always have 5 items
        const mergedFaqItems = defaultFaqItems.map(defaultItem => {
          const cmsItem = data.faq?.items?.find((item: any) => item.id === defaultItem.id)
          return cmsItem || defaultItem
        })

        setFaq({
          heading: data.faq?.heading || "Before You Pack, Read This FAQs.",
          items: mergedFaqItems
        })
        setTripOptions(data.tripOptions ?? {
          heading: 'How Do You Want To Explore? ',
          subheading: 'Choose your perfect adventure',
          customLabel: 'Custom Trip',
          groupLabel: 'Group Departure',
          customTrips: [],
          groupTrips: []
        })
        setTripHighlights(data.tripHighlights ?? {
          heading: "Discover Hidden Gems",
          subheading: "Experience the most breathtaking destinations",
          highlights: []
        })
        setGroupCta(data.groupCta ?? {
          heading: "Travelling with 8 or more ?",
          subtext: "Enjoy a free photographer on your trip or unlock up to 40% off as the trip planner.",
          buttonLabel: "Plan my trip",
          backgroundImageUrl: ""
        })
        // Advanced sections fetch skipped in simplified editor
        setError(null)
      } catch (e) {
        // keep defaults
      }
    }
    loadInitial()
  }, [citySlug])

  // Fetch itineraries for selected city
  const fetchItineraries = useCallback(async () => {
    if (!citySlug) return
    try {
      setItLoading(true)
      setItError(null)
      const data = await fetchApi<{ packages: ItineraryPackage[] }>(`/api/packages/city/${citySlug}`)
      setItineraries((data.packages || []) as ItineraryPackage[])
    } catch (_) {
      setItError('Failed to load itineraries')
    } finally {
      setItLoading(false)
    }
  }, [citySlug])

  // Disable embedded itineraries fetch now that we redirect to dedicated page

  const createItinerary = async (): Promise<void> => {
    try {
      const payload: any = {
        name: newItinerary.name,
        state: citySlug,
        primaryDestination: newItinerary.destination,
        otherDestinations: "",
        numDays: newItinerary.days || 0,
        numNights: newItinerary.nights || 0,
        packageType: newItinerary.tripType === 'group' ? 'Fixed Departure' : 'Custom',
        packageCategory: newItinerary.category,
        packageTheme: "Adventure",
        pickupPoint: "",
        dropPoint: "",
        shortDescription: newItinerary.description,
        price: newItinerary.price || 0,
        status: "Active",
        marketplaceShared: newItinerary.featured,
        startDate: "",
        endDate: "",
        adults: 2,
        children: 0,
        packageIncludes: newItinerary.includes ? newItinerary.includes.split(',').map(i => i.trim()) : [],
        packageExcludes: [],
        packageTerms: "",
        notes: "",
        packageItineraries: [],
        siteContent: {
           partnerName: "",
           partnerProfilePhoto: "",
           summaryText: newItinerary.description,
           summaryHighlights: newItinerary.highlights ? newItinerary.highlights.split(',').map(h => h.trim()) : [],
           summaryImage: "",
           hero: { videoUrl: "" },
           structuredInclusions: [],
           reviews: [],
           testimonials: [],
           whyChooseUs: { title: "", points: [] },
           faqs: []
        }
      }
      let response: Response
      if (newItImageFile) {
        const form = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
          form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
        })
        form.append('citySlug', citySlug)
        form.append('image', newItImageFile)
        response = await fetchApi('/api/packages', { method: 'POST', body: form })
      } else {
        response = await fetchApi('/api/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, citySlug })
        })
      }
      const data = response
      setShowCreateItModal(false)
      setNewItImageFile(null)
      setNewItinerary({
        name: '', destination: '', duration: '', price: 0, originalPrice: 0, description: '',
        highlights: '', includes: '', category: 'Adventure', featured: false, route: '', nights: 0, days: 0, tripType: 'custom'
      })
      fetchItineraries()
    } catch (e: any) {
      alert(e.message || 'Failed to create')
    }
  }

  const openEditItinerary = (pkg: ItineraryPackage): void => {
    setEditItId(pkg.id)
    setEditItForm({
      name: pkg.name,
      destination: pkg.destination,
      duration: pkg.duration,
      price: pkg.price,
      originalPrice: pkg.original_price,
      description: pkg.description,
      highlights: (pkg.highlights || []).join(', '),
      includes: (pkg.includes || []).join(', '),
      category: pkg.category,
      featured: pkg.featured,
      route: pkg.route || '',
      nights: pkg.nights || 0,
      days: pkg.days || 0,
      tripType: (pkg.trip_type as 'custom' | 'group') || 'custom'
    })
    setShowEditItModal(true)
  }

  const saveEditItinerary = async (): Promise<void> => {
    if (!editItId) return
    try {
      let response: Response
      if (editItImageFile) {
        const form = new FormData()
        const partial: any = {
          name: editItForm.name,
          state: citySlug,
          primaryDestination: editItForm.destination,
          otherDestinations: "",
          numDays: editItForm.days || 0,
          numNights: editItForm.nights || 0,
          packageType: editItForm.tripType === 'group' ? 'Fixed Departure' : 'Custom',
          packageCategory: editItForm.category,
          packageTheme: "Adventure",
          pickupPoint: "",
          dropPoint: "",
          shortDescription: editItForm.description,
          price: editItForm.price || 0,
          status: "Active",
          marketplaceShared: editItForm.featured,
          startDate: "",
          endDate: "",
          adults: 2,
          children: 0,
          packageIncludes: editItForm.includes ? editItForm.includes.split(',').map(i => i.trim()) : [],
          packageExcludes: [],
          packageTerms: "",
          notes: "",
          packageItineraries: [],
          siteContent: {
             partnerName: "",
             partnerProfilePhoto: "",
             summaryText: editItForm.description,
             summaryHighlights: editItForm.highlights ? editItForm.highlights.split(',').map(h => h.trim()) : [],
             summaryImage: "",
             hero: { videoUrl: "" },
             structuredInclusions: [],
             reviews: [],
             testimonials: [],
             whyChooseUs: { title: "", points: [] },
             faqs: []
          }
        }
        Object.entries(partial).forEach(([key, value]) => {
          if (value === undefined || value === null) return
          form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
        })
        form.append('image', editItImageFile)
        response = await fetchApi(`/api/packages/${editItId}`, { method: 'PUT', body: form })
      } else {
        const partial: any = {
          name: editItForm.name,
          state: citySlug,
          primaryDestination: editItForm.destination,
          otherDestinations: "",
          numDays: editItForm.days || 0,
          numNights: editItForm.nights || 0,
          packageType: editItForm.tripType === 'group' ? 'Fixed Departure' : 'Custom',
          packageCategory: editItForm.category,
          packageTheme: "Adventure",
          pickupPoint: "",
          dropPoint: "",
          shortDescription: editItForm.description,
          price: editItForm.price || 0,
          status: "Active",
          marketplaceShared: editItForm.featured,
          startDate: "",
          endDate: "",
          adults: 2,
          children: 0,
          packageIncludes: editItForm.includes ? editItForm.includes.split(',').map(i => i.trim()) : [],
          packageExcludes: [],
          packageTerms: "",
          notes: "",
          packageItineraries: [],
          siteContent: {
             partnerName: "",
             partnerProfilePhoto: "",
             summaryText: editItForm.description,
             summaryHighlights: editItForm.highlights ? editItForm.highlights.split(',').map(h => h.trim()) : [],
             summaryImage: "",
             hero: { videoUrl: "" },
             structuredInclusions: [],
             reviews: [],
             testimonials: [],
             whyChooseUs: { title: "", points: [] },
             faqs: []
          }
        }
        response = await fetchApi(`/api/packages/${editItId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partial)
        })
      }
      const data = response
      setShowEditItModal(false)
      setEditItImageFile(null)
      fetchItineraries()
    } catch (e: any) {
      alert(e.message || 'Failed to update')
    }
  }

  const handleImageUpload = async (
    file: File,
    onUrl: (url: string) => void
  ): Promise<void> => {
    try {
      const form = new FormData()
      form.append('file', file)
      const data = await fetchApi<{ url: string; error?: string }>('/api/upload', {
        method: 'POST',
        body: form
      })
      if (data.url) {
        onUrl(data.url)
      } else {
        setError(data.error || 'Failed to upload image')
      }
    } catch (e) {
      setError('Failed to upload image')
    }
  }

  const saveAll = async (): Promise<void> => {
    if (!citySlug) return
    try {
      setSaving(true)
      await fetchApi(`/api/cms/cities/${citySlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          header,
          contact,
          tripOptions,
          hero,
          reviews,
          faq,
          usp,
          brands,
          tripHighlights,
          groupCta,
          accommodation
        })
      })
      setError(null)
      alert(`${cityName} content saved`)
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveSection = async (sectionName: string, data: any): Promise<void> => {
    if (!citySlug) return
    try {
      setSaving(true)
      console.log(`Saving ${sectionName} for ${citySlug}:`, data)

      // Debug: Check for base64 data in payload
      const payloadString = JSON.stringify(data)
      if (data.hero) {
        console.log(`[CMS-DEBUG] Saving Hero - Keys:`, Object.keys(data.hero));
        console.log(`[CMS-DEBUG] Saving Hero - Desktop Video:`, data.hero.desktopVideoUrl);
      }
      const hasBase64 = payloadString.includes('data:image')
      console.log(`Saving ${sectionName} - Payload size: ${payloadString.length} bytes`)
      console.log(`Saving ${sectionName} - Contains base64: ${hasBase64}`)

      if (hasBase64) {
        console.warn('WARNING: Payload contains base64 data! This may cause 413 errors.')
        // Find and log base64 data
        const base64Matches = payloadString.match(/data:image[^"]+/g)
        if (base64Matches) {
          console.log('Base64 data found:', base64Matches.map(match => match.substring(0, 50) + '...'))
        }
      }

      const result = await fetchApi(`/api/cms/cities/${citySlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: payloadString
      })

      console.log('Save successful:', result)

      setError(null)
      alert(`${sectionName} saved successfully`)
    } catch (e: any) {
      console.error('Save error:', e)
      setError(e.message || `Failed to save ${sectionName}`)
    } finally {
      setSaving(false)
    }
  }

  // No city selected → show the 7 location cards
  // Preload hero images for all locations and cache in localStorage for instant subsequent loads
  useEffect(() => {
    const loadThumbs = async () => {
      try {
        // Clear thumbs to force refresh and show pulse effect
        setHeroThumbs({})

        // Load images with better error handling and concurrent loading
        const entries = await Promise.allSettled(
          locations.map(async (loc: { slug: string; name: string; updated_at?: string }) => {
            try {
              const data = await fetchApi(`/api/cms/cities/${loc.slug}`).catch(() => ({}))
              const url = data?.hero?.backgroundImageUrl || ''

              // Preload image with better error handling
              if (url) {
                return new Promise<[string, string]>((resolve) => {
                  const img = new window.Image()
                  img.onload = () => resolve([loc.slug, url])
                  img.onerror = () => resolve([loc.slug, ''])
                  img.src = url
                  // Fallback timeout
                  setTimeout(() => resolve([loc.slug, url]), 2000)
                })
              }
              return [loc.slug, ''] as const
            } catch (_) {
              return [loc.slug, ''] as const
            }
          })
        )

        const map: Record<string, string> = {}
        entries.forEach((result: any) => {
          if (result.status === 'fulfilled') {
            const [slug, url] = result.value
            if (url) map[slug] = url
          }
        })

        if (Object.keys(map).length) {
          setHeroThumbs(map)
        }
      } catch (_) { /* ignore */ }
    }
    if (!citySlug) loadThumbs()
  }, [citySlug, locations])

  if (!citySlug) {
    const handleDuplicate = async () => {
      if (!duplicateName.trim()) { setDuplicateError('Name is required'); return }
      const slug = duplicateSlug.trim() || duplicateName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      if (!slug) { setDuplicateError('Invalid slug'); return }
      setDuplicating(true); setDuplicateError('')
      try {
        const res = await fetchApi('/api/cms/cities/duplicate', { method: 'POST', body: JSON.stringify({ source_slug: duplicateSource, new_slug: slug, new_name: duplicateName.trim() }) })
        if (res?.ok) { setShowDuplicateModal(false); setDuplicateName(''); setDuplicateSlug(''); loadCities() }
        else setDuplicateError(res?.error || 'Failed to duplicate')
      } catch (e: any) { setDuplicateError(e?.message || 'Failed to duplicate') }
      finally { setDuplicating(false) }
    }

    const handleRename = async () => {
      if (!renameName.trim()) { setRenameError('Name is required'); return }
      const slug = renameSlug.trim() || renameName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      if (!slug) { setRenameError('Invalid slug'); return }
      setRenaming(true); setRenameError('')
      try {
        const res = await fetchApi(`/api/cms/cities/${renameSource}/rename`, { method: 'PUT', body: JSON.stringify({ new_slug: slug, new_name: renameName.trim() }) })
        if (res?.ok) { setShowRenameModal(false); setRenameName(''); setRenameSlug(''); loadCities() }
        else setRenameError(res?.error || 'Failed to rename')
      } catch (e: any) { setRenameError(e?.message || 'Failed to rename') }
      finally { setRenaming(false) }
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Website CMS</h1>
            <p className="text-sm text-gray-500 mt-1">Select a location to edit its landing page content</p>
          </div>
        </div>
        {/* Search & Date Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={cmsSearch}
              onChange={(e) => setCmsSearch(e.target.value)}
              placeholder="Search pages..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 text-gray-900 bg-white"
            />
          </div>
          <div className="flex gap-1.5">
            {([['all', 'All'], ['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setCmsDateFilter(key)}
                className={`px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors ${cmsDateFilter === key ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(() => {
            let filtered = locations
            if (cmsSearch.trim()) {
              const q = cmsSearch.toLowerCase()
              filtered = filtered.filter(l => l.name.toLowerCase().includes(q) || l.slug.toLowerCase().includes(q))
            }
            if (cmsDateFilter !== 'all') {
              const days = cmsDateFilter === '7d' ? 7 : cmsDateFilter === '30d' ? 30 : 90
              const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days)
              filtered = filtered.filter(l => l.updated_at && new Date(l.updated_at) >= cutoff)
            }
            if (filtered.length === 0) return <div className="col-span-full text-center py-8 text-sm text-gray-400">No pages match your filters</div>
            return filtered.map((loc, idx) => (
            <div key={loc.slug} className="group bg-white border border-gray-200 hover:border-slate-300 hover:shadow-md transition-all rounded-xl overflow-hidden">
              <button onClick={() => setCitySlug(loc.slug)} className="w-full text-left">
                <div className="h-28 w-full relative overflow-hidden bg-gradient-to-r from-gray-100 to-gray-50">
                  {heroThumbs[loc.slug] ? (
                    <Image src={heroThumbs[loc.slug]} alt={`${loc.name} hero`} fill sizes="(max-width: 640px) 100vw, (max-width:1024px) 50vw, 33vw" priority={idx < 6} fetchPriority={idx < 6 ? 'high' : 'low'} className="object-cover group-hover:scale-105 transition-transform duration-300" quality={85} unoptimized={true} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-gray-400 font-medium text-sm">{loc.name}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{loc.name}</h3>
                      <p className="text-[11px] text-teal-600 mt-0.5">campaign.travloger.in/{loc.slug}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{loc.updated_at ? `Modified ${new Date(loc.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No edits yet'}</p>
                    </div>
                    <span className="text-gray-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all text-lg">→</span>
                  </div>
                </div>
              </button>
              <div className="px-4 pb-3 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`https://campaign.travloger.in/${loc.slug}`); }}
                  className="flex-1 text-xs text-gray-500 hover:text-teal-600 border border-gray-200 hover:border-teal-300 rounded-lg px-2 py-1.5 transition-colors"
                  title="Copy link"
                >
                  🔗 Copy Link
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDuplicateSource(loc.slug); setDuplicateName(''); setDuplicateSlug(''); setDuplicateError(''); setShowDuplicateModal(true) }}
                  className="flex-1 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-lg px-2 py-1.5 transition-colors"
                >
                  ⧉ Duplicate
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setRenameSource(loc.slug); setRenameName(loc.name); setRenameSlug(loc.slug); setRenameError(''); setShowRenameModal(true) }}
                  className="flex-1 text-xs text-gray-500 hover:text-orange-600 border border-gray-200 hover:border-orange-300 rounded-lg px-2 py-1.5 transition-colors"
                >
                  ✎ Rename
                </button>
              </div>
            </div>
          ))
          })()}
        </div>

        {/* Duplicate Modal */}
        {showDuplicateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Duplicate Landing Page</h3>
              <p className="text-sm text-gray-500 mb-4">Creating a copy of <span className="font-medium text-gray-700">{duplicateSource}</span> with empty sections</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page Name *</label>
                  <input type="text" value={duplicateName} onChange={(e) => { setDuplicateName(e.target.value); setDuplicateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) }} placeholder="e.g. Shimla" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-400 mr-1">campaign.travloger.in/</span>
                    <input type="text" value={duplicateSlug} onChange={(e) => setDuplicateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="shimla" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                  </div>
                </div>
                {duplicateError && <p className="text-sm text-red-600">{duplicateError}</p>}
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setShowDuplicateModal(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button onClick={handleDuplicate} disabled={duplicating} className="px-4 py-2 text-sm text-white bg-slate-800 rounded-md hover:bg-slate-700 disabled:opacity-50">
                  {duplicating ? 'Creating...' : 'Create Page'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rename Modal */}
        {showRenameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Rename Landing Page</h3>
              <p className="text-sm text-gray-500 mb-4">Renaming <span className="font-medium text-gray-700">{renameSource}</span> — this will change the URL slug</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Page Name *</label>
                  <input type="text" value={renameName} onChange={(e) => { setRenameName(e.target.value); setRenameSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) }} placeholder="e.g. Shimla" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New URL Slug</label>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-400 mr-1">campaign.travloger.in/</span>
                    <input type="text" value={renameSlug} onChange={(e) => setRenameSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="shimla" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                  </div>
                </div>
                {renameError && <p className="text-sm text-red-600">{renameError}</p>}
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setShowRenameModal(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button onClick={handleRename} disabled={renaming} className="px-4 py-2 text-sm text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50">
                  {renaming ? 'Renaming...' : 'Rename Page'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Helper function to check if section should be visible
  const isSectionVisible = (sectionName: string) => {
    if (!searchQuery) return true
    return filteredSections.includes(sectionName.toLowerCase())
  }

  // City selected → show the existing editor UI for that scope
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Website Editor</h1>
            <p className="text-sm text-gray-500 mt-1">
              Editing: <span className="font-semibold text-slate-800">{cityName}</span>
              <a href={`https://campaign.travloger.in/${citySlug}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-teal-600 hover:underline">campaign.travloger.in/{citySlug} ↗</a>
            </p>
          </div>
          <button
            onClick={() => setCitySlug('')}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md shadow-sm">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      {isSectionVisible('header') && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Section Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">1. Header Section</h2>
                  <p className="text-xs text-gray-500">Navigation menu and contact details</p>
                </div>
              </div>
              <button
                onClick={() => saveSection('Header', { header })}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-800 hover:bg-slate-700 disabled:bg-gray-400 shadow-sm transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Section Content */}
          <div className="p-6">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Navigation Items
                </label>
                <div className="space-y-2">
                  {header.navItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => {
                          const newNavItems = [...header.navItems]
                          newNavItems[index] = { ...item, label: e.target.value }
                          setHeader({ ...header, navItems: newNavItems })
                        }}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                        placeholder="Label"
                      />
                      <input
                        type="text"
                        value={item.href}
                        onChange={(e) => {
                          const newNavItems = [...header.navItems]
                          newNavItems[index] = { ...item, href: e.target.value }
                          setHeader({ ...header, navItems: newNavItems })
                        }}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                        placeholder="Link"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Enquire Label
                </label>
                <input
                  type="text"
                  value={header.enquireLabel}
                  onChange={(e) => setHeader({ ...header, enquireLabel: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  placeholder="Enquire now"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Call Number
                </label>
                <input
                  type="text"
                  value={header.callNumber}
                  onChange={(e) => setHeader({ ...header, callNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  placeholder="+919876543210"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      {isSectionVisible('hero') && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Section Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">2. Hero Section</h2>
                  <p className="text-xs text-gray-500">Main banner with title, subtitle & background</p>
                </div>
              </div>
              <button
                onClick={() => saveSection('Hero', { hero, contact })}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-800 hover:bg-slate-700 disabled:bg-gray-400 shadow-sm transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Section Content */}
          <div className="p-6">
            <div className="space-y-3">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Hero Headline
                </label>
                <input
                  type="text"
                  value={hero.title}
                  onChange={(e) => setHero(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  placeholder="How Do You Want To Experience Ladakh?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Highlight Text <span className="text-xs text-gray-400">(words highlighted in teal with brush underline)</span>
                </label>
                <input
                  type="text"
                  value={hero.highlightText || ''}
                  onChange={(e) => setHero(prev => ({ ...prev, highlightText: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  placeholder="Explore Kashmir"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Hero Sub-heading
                </label>
                <input
                  type="text"
                  value={hero.subtitle}
                  onChange={(e) => setHero(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  placeholder="Group departures or custom all-inclusive journeys"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Background Image URL
                </label>
                <input
                  type="url"
                  value={hero.backgroundImageUrl}
                  onChange={(e) => setHero(prev => ({ ...prev, backgroundImageUrl: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-slate-800 text-black bg-white"
                  placeholder="https://example.com/image.jpg"
                />
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Or upload image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      // Check file size (4MB limit)
                      const maxSize = 4 * 1024 * 1024 // 4MB
                      if (file.size > maxSize) {
                        alert(`File too large. Maximum size is 4MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please compress the image and try again.`)
                        return
                      }

                      try {
                        const form = new FormData()
                        form.append('file', file)
                        form.append('slug', citySlug || 'common')
                        form.append('folder', 'hero')

                        const data = await fetchApi<{ url: string }>('/api/upload', { method: 'POST', body: form })
                        setHero(prev => ({ ...prev, backgroundImageUrl: data.url }))
                      } catch (err: any) {
                        setError(err?.message || 'Failed to upload image')
                      }
                    }}
                    className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-medium hover:file:bg-slate-200 file:cursor-pointer cursor-pointer"
                  />
                </div>

                {hero.backgroundImageUrl && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Preview</label>
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                      <Image
                        src={hero.backgroundImageUrl}
                        alt="Hero background preview"
                        fill
                        className="object-cover"
                        unoptimized={true}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 truncate max-w-[80%]">{hero.backgroundImageUrl}</span>
                      <button
                        type="button"
                        onClick={() => setHero(prev => ({ ...prev, backgroundImageUrl: '' }))}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mobile Background Image URL
                </label>
                <input
                  type="url"
                  value={hero.mobileBackgroundImageUrl || ''}
                  onChange={(e) => setHero(prev => ({ ...prev, mobileBackgroundImageUrl: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  placeholder="https://example.com/mobile-image.jpg"
                />
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Or upload mobile image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      // Check file size (4MB limit)
                      const maxSize = 4 * 1024 * 1024 // 4MB
                      if (file.size > maxSize) {
                        alert(`File too large. Maximum size is 4MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please compress the image and try again.`)
                        return
                      }

                      try {
                        const form = new FormData()
                        form.append('file', file)
                        form.append('slug', citySlug || 'common')
                        form.append('folder', 'hero')

                        const data = await fetchApi<{ url: string }>('/api/upload', { method: 'POST', body: form })
                        setHero(prev => ({ ...prev, mobileBackgroundImageUrl: data.url }))
                      } catch (err: any) {
                        setError(err?.message || 'Failed to upload image')
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  />
                </div>

                {hero.mobileBackgroundImageUrl && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Preview</label>
                    <div className="relative w-24 h-40 rounded-md overflow-hidden border border-gray-200">
                      <Image
                        src={hero.mobileBackgroundImageUrl}
                        alt="Hero mobile background preview"
                        fill
                        className="object-cover"
                        unoptimized={true}
                      />
                    </div>
                    <div className="mt-1.5">
                      <button
                        type="button"
                        onClick={() => setHero(prev => ({ ...prev, mobileBackgroundImageUrl: '' }))}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove Mobile Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mobile Video (MP4/WebM)
                </label>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // Check file size (50MB limit for videos)
                      const maxSize = 50 * 1024 * 1024 // 50MB
                      if (file.size > maxSize) {
                        alert(`File too large. Maximum size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please compress the video and try again.`)
                        return
                      }

                      try {
                        const form = new FormData()
                        form.append('file', file)
                        form.append('slug', citySlug || 'common')
                        form.append('folder', 'hero')

                        const data = await fetchApi<{ url: string }>('/api/upload', { method: 'POST', body: form })
                        setHero(prev => ({ ...prev, mobileVideoUrl: data.url }))
                      } catch (err: any) {
                        setError(err?.message || 'Failed to upload video')
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                />
              </div>

              {hero.mobileVideoUrl && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Video Preview</label>
                  <div className="relative w-full h-32 rounded-md overflow-hidden border border-gray-200">
                    <video
                      src={hero.mobileVideoUrl}
                      className="w-full h-full object-cover"
                      controls
                      muted
                    />
                  </div>
                  <div className="mt-1.5">
                    <button
                      type="button"
                      onClick={() => setHero(prev => ({ ...prev, mobileVideoUrl: '' }))}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove Video
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Desktop Video (MP4/WebM)
                </label>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // Check file size (50MB limit for videos)
                      const maxSize = 50 * 1024 * 1024 // 50MB
                      if (file.size > maxSize) {
                        alert(`File too large. Maximum size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please compress the video and try again.`)
                        return
                      }

                      try {
                        const form = new FormData()
                        form.append('file', file)
                        form.append('slug', citySlug || 'common')
                        form.append('folder', 'hero')

                        const data = await fetchApi<{ url: string }>('/api/upload', { method: 'POST', body: form })
                        setHero(prev => ({ ...prev, desktopVideoUrl: data.url }))
                      } catch (err: any) {
                        setError(err?.message || 'Failed to upload video')
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                />
              </div>

              {hero.desktopVideoUrl && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Desktop Video Preview</label>
                  <div className="relative w-full h-32 rounded-md overflow-hidden border border-gray-200">
                    <video
                      src={hero.desktopVideoUrl}
                      className="w-full h-full object-cover"
                      controls
                      muted
                    />
                  </div>
                  <div className="mt-1.5">
                    <button
                      type="button"
                      onClick={() => setHero(prev => ({ ...prev, desktopVideoUrl: '' }))}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove Desktop Video
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  WhatsApp Phone
                </label>
                <input
                  type="text"
                  value={hero.whatsappPhone}
                  onChange={(e) => setHero(prev => ({ ...prev, whatsappPhone: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  placeholder="+919876543210"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Floating Bar WhatsApp Number
                </label>
                <input
                  type="text"
                  value={contact.whatsapp || ''}
                  onChange={(e) => setContact(prev => ({ ...prev, whatsapp: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  placeholder="+919876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Expert Button Text
                </label>
                <input
                  type="text"
                  value={contact.expertButtonText || ''}
                  onChange={(e) => setContact(prev => ({ ...prev, expertButtonText: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  placeholder="Talk to an Expert"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Twitter URL</label>
                <input type="url" value={contact.twitterUrl || ''} onChange={(e) => setContact(prev => ({ ...prev, twitterUrl: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white" placeholder="https://twitter.com/travloger" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Facebook URL</label>
                <input type="url" value={contact.facebookUrl || ''} onChange={(e) => setContact(prev => ({ ...prev, facebookUrl: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white" placeholder="https://facebook.com/travloger" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram URL</label>
                <input type="url" value={contact.instagramUrl || ''} onChange={(e) => setContact(prev => ({ ...prev, instagramUrl: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white" placeholder="https://instagram.com/travloger" />
              </div>

              <div className="md:col-span-2 space-y-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Enquiry Form Text</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Form Title</label>
                    <input type="text" value={contact.formTitle || ''} onChange={(e) => setContact(prev => ({ ...prev, formTitle: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white" placeholder="Let's Make It Happen!" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Form Subtitle</label>
                    <input type="text" value={contact.formSubtitle || ''} onChange={(e) => setContact(prev => ({ ...prev, formSubtitle: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white" placeholder="We'll call you with a perfect plan." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Form Button Text</label>
                    <input type="text" value={contact.formButtonText || ''} onChange={(e) => setContact(prev => ({ ...prev, formButtonText: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white" placeholder="Get My Custom Plan" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Enquiry Form Background Image</label>
                {/* Desktop image */}
                <div className="flex items-center gap-4">
                  {contact.formBackgroundImageUrl && (
                    <div className="relative w-20 h-12 rounded border border-gray-300 overflow-hidden flex-shrink-0">
                      <Image src={contact.formBackgroundImageUrl} alt="Form BG Desktop" fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-gray-400 block mb-0.5" title={ENQUIRY_FORM_IMAGE_TOOLTIP_DESKTOP}>
                      Desktop: ratio {ENQUIRY_FORM_IMAGE_RATIO_DESKTOP} (e.g. 1200×400 px)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      title={ENQUIRY_FORM_IMAGE_TOOLTIP_DESKTOP}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          await handleImageUpload(file, (url) => {
                            setContact(prev => ({ ...prev, formBackgroundImageUrl: url }))
                          })
                        }
                      }}
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 bg-white text-black"
                    />
                  </div>
                </div>
                {/* Mobile image (optional) */}
                <div className="flex items-center gap-4">
                  {contact.formBackgroundImageUrlMobile && (
                    <div className="relative w-12 h-12 rounded border border-gray-300 overflow-hidden flex-shrink-0">
                      <Image src={contact.formBackgroundImageUrlMobile} alt="Form BG Mobile" fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-gray-400 block mb-0.5" title={ENQUIRY_FORM_IMAGE_TOOLTIP_MOBILE}>
                      Mobile (optional): ratio {ENQUIRY_FORM_IMAGE_RATIO_MOBILE} (e.g. 600×600 px)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      title={ENQUIRY_FORM_IMAGE_TOOLTIP_MOBILE}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          await handleImageUpload(file, (url) => {
                            setContact(prev => ({ ...prev, formBackgroundImageUrlMobile: url }))
                          })
                        }
                      }}
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 bg-white text-black"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Indicators Section */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Trust Indicators</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Google Ratings */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Google</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rating/Value</label>
                    <input
                      type="text"
                      value={hero.trustIndicators?.google?.rating || DEFAULT_TRUST_INDICATORS.google.rating}
                      onChange={(e) => setHero(prev => {
                        const ti = prev.trustIndicators || DEFAULT_TRUST_INDICATORS;
                        return {
                          ...prev,
                          trustIndicators: {
                            ...ti,
                            google: { ...ti.google, rating: e.target.value }
                          }
                        }
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white"
                      placeholder="4.9"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Label</label>
                    <input
                      type="text"
                      value={hero.trustIndicators?.google?.label || DEFAULT_TRUST_INDICATORS.google.label}
                      onChange={(e) => setHero(prev => {
                        const ti = prev.trustIndicators || DEFAULT_TRUST_INDICATORS;
                        return {
                          ...prev,
                          trustIndicators: {
                            ...ti,
                            google: { ...ti.google, label: e.target.value }
                          }
                        }
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white"
                      placeholder="Ratings"
                    />
                  </div>
                </div>

                {/* Pay Later */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Pay Later</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rating/Value</label>
                    <input
                      type="text"
                      value={hero.trustIndicators?.payLater?.rating || DEFAULT_TRUST_INDICATORS.payLater.rating}
                      onChange={(e) => setHero(prev => {
                        const ti = prev.trustIndicators || DEFAULT_TRUST_INDICATORS;
                        return {
                          ...prev,
                          trustIndicators: {
                            ...ti,
                            payLater: { ...ti.payLater, rating: e.target.value }
                          }
                        }
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white"
                      placeholder="Pay Later"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Label</label>
                    <input
                      type="text"
                      value={hero.trustIndicators?.payLater?.label || DEFAULT_TRUST_INDICATORS.payLater.label}
                      onChange={(e) => setHero(prev => {
                        const ti = prev.trustIndicators || DEFAULT_TRUST_INDICATORS;
                        return {
                          ...prev,
                          trustIndicators: {
                            ...ti,
                            payLater: { ...ti.payLater, label: e.target.value }
                          }
                        }
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white"
                      placeholder="Flexible"
                    />
                  </div>
                </div>

                {/* Instagram */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-pink-400"></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Instagram</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rating/Value</label>
                    <input
                      type="text"
                      value={hero.trustIndicators?.instagram?.rating || DEFAULT_TRUST_INDICATORS.instagram.rating}
                      onChange={(e) => setHero(prev => {
                        const ti = prev.trustIndicators || DEFAULT_TRUST_INDICATORS;
                        return {
                          ...prev,
                          trustIndicators: {
                            ...ti,
                            instagram: { ...ti.instagram, rating: e.target.value }
                          }
                        }
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white"
                      placeholder="5K+"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Label</label>
                    <input
                      type="text"
                      value={hero.trustIndicators?.instagram?.label || DEFAULT_TRUST_INDICATORS.instagram.label}
                      onChange={(e) => setHero(prev => {
                        const ti = prev.trustIndicators || DEFAULT_TRUST_INDICATORS;
                        return {
                          ...prev,
                          trustIndicators: {
                            ...ti,
                            instagram: { ...ti.instagram, label: e.target.value }
                          }
                        }
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white"
                      placeholder="Followers"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Redirect URL</label>
                    <input
                      type="url"
                      value={hero.trustIndicators?.instagram?.url || ''}
                      onChange={(e) => setHero(prev => {
                        const ti = prev.trustIndicators || DEFAULT_TRUST_INDICATORS;
                        return {
                          ...prev,
                          trustIndicators: {
                            ...ti,
                            instagram: { ...ti.instagram, url: e.target.value }
                          }
                        }
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white"
                      placeholder="https://instagram.com/yourpage"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accommodation Section */}
      {isSectionVisible('accommodation') && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Accommodation</h2>
                  <p className="text-xs text-gray-500">Stock vs Real comparison images</p>
                </div>
              </div>
              <button
                onClick={() => saveSection('Accommodation', { accommodation })}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-800 hover:bg-slate-700 disabled:bg-gray-400 shadow-sm transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
                <input
                  type="text"
                  value={accommodation.heading}
                  onChange={(e) => setAccommodation(prev => ({ ...prev, heading: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Promise Text Label</label>
                    <input
                      type="text"
                      value={accommodation.promiseText || 'What they promise'}
                      onChange={(e) => setAccommodation(prev => ({ ...prev, promiseText: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                      placeholder="What they promise"
                    />
                    <p className="text-xs text-gray-500 mt-1">Text displayed on the stock image</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Get Text Label</label>
                    <input
                      type="text"
                      value={accommodation.getText || 'What you get'}
                      onChange={(e) => setAccommodation(prev => ({ ...prev, getText: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                      placeholder="What you get"
                    />
                    <p className="text-xs text-gray-500 mt-1">Text displayed on the real image</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock Image</label>
                    <div className="space-y-3">
                      {accommodation.stockImage && (
                        <div className="relative w-full h-40 rounded-lg border border-gray-300 overflow-hidden bg-gray-50">
                          <Image src={accommodation.stockImage} alt="Stock" fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            await handleImageUpload(file, (url) => {
                              setAccommodation(prev => ({ ...prev, stockImage: url }))
                            })
                          }
                        }}
                        className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Real Image</label>
                    <div className="space-y-3">
                      {accommodation.realImage && (
                        <div className="relative w-full h-40 rounded-lg border border-gray-300 overflow-hidden bg-gray-50">
                          <Image src={accommodation.realImage} alt="Real" fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            await handleImageUpload(file, (url) => {
                              setAccommodation(prev => ({ ...prev, realImage: url }))
                            })
                          }
                        }}
                        className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trip Options Section */}
      {isSectionVisible('trip options') && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Section Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">3. Trip Options Section</h2>
                  <p className="text-xs text-gray-500">Custom & Group trip packages</p>
                </div>
              </div>
              <button
                onClick={() => saveSection('TripOptions', { tripOptions })}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-800 hover:bg-slate-700 disabled:bg-gray-400 shadow-sm transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Section Content */}
          <div className="p-6">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Heading
                </label>
                <input
                  type="text"
                  value={tripOptions.heading}
                  onChange={(e) => setTripOptions(prev => ({ ...prev, heading: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  placeholder="Trip options heading"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Highlight Text <span className="text-xs text-gray-400">(words from heading to show in teal)</span>
                </label>
                <input
                  type="text"
                  value={tripOptions.highlightText || ''}
                  onChange={(e) => setTripOptions(prev => ({ ...prev, highlightText: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  placeholder="e.g. Explore Ladakh?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subheading
                </label>
                <input
                  type="text"
                  value={tripOptions.subheading}
                  onChange={(e) => setTripOptions(prev => ({ ...prev, subheading: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  placeholder="Trip options subheading"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Custom Label
                </label>
                <input
                  type="text"
                  value={tripOptions.customLabel}
                  onChange={(e) => setTripOptions(prev => ({ ...prev, customLabel: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  placeholder="Custom trips label"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Group Label
                </label>
                <input
                  type="text"
                  value={tripOptions.groupLabel}
                  onChange={(e) => setTripOptions(prev => ({ ...prev, groupLabel: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  placeholder="Group trips label"
                />
              </div>
            </div>

            {/* Custom Trips Section */}
            <div className="mt-6 pt-6 border-t-2 border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900">Custom Trips</h3>
              </div>

              {/* Custom Trip Selector Dropdown */}
              <div className="mb-4">
                <select
                  value={selectedCustomTrip}
                  onChange={(e) => setSelectedCustomTrip(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                >
                  <option value="">Select a custom trip to edit</option>
                  {(tripOptions.customTrips || []).map((trip, index) => (
                    <option key={trip.id} value={trip.id}>
                      Custom Trip {index + 1} - {trip.title || 'Untitled Trip'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add New Custom Trip Button */}
              <div className="mb-4">
                <button
                  onClick={() => {
                    const newTrip: TripOption = {
                      id: `custom-${Date.now()}`,
                      title: 'New Custom Trip',
                      description: 'Custom trip description',
                      image: '/cards/1.jpg',
                      nights: 3,
                      days: 4,
                      price: 12000,
                      category: 'custom',
                      route: '',
                      trending: false,
                      detailedItinerary: {
                        subtitle: 'Custom Travel Experience',
                        headerImage: '',
                        briefItinerary: [
                          { day: 1, title: '', description: '' }
                        ],
                        keyAttractions: [],
                        inclusions: [],
                        showInclusions: true
                      },
                      features: [
                        { name: 'Sightseeing', icon: 'default' as const, included: true },
                        { name: 'Transfers', icon: 'default' as const, included: true },
                        { name: 'Meals', icon: 'default' as const, included: true },
                        { name: 'Stay', icon: 'default' as const, included: true },
                        { name: 'Trip Assistance', icon: 'default' as const, included: true },
                        { name: 'Flights', icon: 'flights' as const, included: false }
                      ]
                    }
                    setTripOptions({ ...tripOptions, customTrips: [...(tripOptions.customTrips || []), newTrip] })
                    setSelectedCustomTrip(newTrip.id)
                  }}
                  className="w-full py-2 text-sm border-2 border-dashed border-gray-200 rounded-md text-gray-600 hover:border-gray-300 hover:text-gray-700 transition-colors"
                >
                  Add New Custom Trip
                </button>
              </div>

              {/* Selected Custom Trip Edit Form */}
              {selectedCustomTrip && tripOptions.customTrips?.find(t => t.id === selectedCustomTrip) && (
                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  {(() => {
                    const trip = tripOptions.customTrips?.find(t => t.id === selectedCustomTrip)!
                    const tripIndex = tripOptions.customTrips?.findIndex(t => t.id === selectedCustomTrip) || 0

                    return (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-4">
                            <h4 className="text-md font-medium text-gray-800">Custom Trip {tripIndex + 1}</h4>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  if (tripIndex > 0) {
                                    const newTrips = [...(tripOptions.customTrips || [])];
                                    [newTrips[tripIndex], newTrips[tripIndex - 1]] = [newTrips[tripIndex - 1], newTrips[tripIndex]];
                                    setTripOptions({ ...tripOptions, customTrips: newTrips });
                                  }
                                }}
                                disabled={tripIndex === 0}
                                className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                title="Move Up"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                              </button>
                              <button
                                onClick={() => {
                                  if (tripIndex < (tripOptions.customTrips?.length || 0) - 1) {
                                    const newTrips = [...(tripOptions.customTrips || [])];
                                    [newTrips[tripIndex], newTrips[tripIndex + 1]] = [newTrips[tripIndex + 1], newTrips[tripIndex]];
                                    setTripOptions({ ...tripOptions, customTrips: newTrips });
                                  }
                                }}
                                disabled={tripIndex === (tripOptions.customTrips?.length || 0) - 1}
                                className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                title="Move Down"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                              </button>
                              <button
                                onClick={() => {
                                  const newTrip = JSON.parse(JSON.stringify(trip));
                                  newTrip.id = `custom-${Date.now()}`;
                                  newTrip.title = `${newTrip.title} (Copy)`;
                                  const newTrips = [...(tripOptions.customTrips || []), newTrip];
                                  setTripOptions({ ...tripOptions, customTrips: newTrips });
                                  setSelectedCustomTrip(newTrip.id);
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded border border-blue-200 ml-2"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                Duplicate
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setTripOptions({
                                ...tripOptions,
                                customTrips: (tripOptions.customTrips || []).filter(t => t.id !== selectedCustomTrip)
                              })
                              setSelectedCustomTrip('')
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove Trip
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trip Title</label>
                            <input
                              type="text"
                              value={trip.title}
                              onChange={(e) => {
                                const newTrips = [...(tripOptions.customTrips || [])]
                                newTrips[tripIndex] = { ...trip, title: e.target.value }
                                setTripOptions({ ...tripOptions, customTrips: newTrips })
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={trip.description}
                              onChange={(e) => {
                                const newTrips = [...(tripOptions.customTrips || [])]
                                newTrips[tripIndex] = { ...trip, description: e.target.value }
                                setTripOptions({ ...tripOptions, customTrips: newTrips })
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trip Image</label>
                            <div className="flex items-center gap-4">
                              {trip.image && (
                                <div className="relative w-16 h-16 rounded-lg border border-gray-300 overflow-hidden">
                                  <Image
                                    src={trip.image}
                                    alt={trip.title}
                                    fill
                                    className="object-cover"
                                    unoptimized={true}
                                  />
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    // Check file size (4MB limit)
                                    const maxSize = 4 * 1024 * 1024 // 4MB
                                    if (file.size > maxSize) {
                                      alert(`File too large. Maximum size is 4MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please compress the image and try again.`)
                                      return
                                    }

                                    try {
                                      const formData = new FormData()
                                      formData.append('file', file)
                                      formData.append('path', `trip-options/${citySlug}/custom-${trip.id}`)

                                      const uploadData = await fetchApi<{ url: string; error?: string }>('/api/upload', {
                                        method: 'POST',
                                        body: formData
                                      })

                                      if (uploadData.url) {
                                        const { url } = uploadData
                                        const newTrips = [...(tripOptions.customTrips || [])]
                                        newTrips[tripIndex] = { ...trip, image: url }
                                        setTripOptions({ ...tripOptions, customTrips: newTrips })
                                      } else {
                                        const errorData = uploadData
                                        console.error('Upload failed:', errorData)
                                        alert(`Upload failed: ${errorData.error || 'Unknown error'}`)
                                      }
                                    } catch (error) {
                                      console.error('Upload error:', error)
                                      alert('Upload failed. Please try again.')
                                    }
                                  }
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                            <input
                              type="text"
                              value={trip.route || ''}
                              onChange={(e) => {
                                const newTrips = [...(tripOptions.customTrips || [])]
                                newTrips[tripIndex] = { ...trip, route: e.target.value }
                                setTripOptions({ ...tripOptions, customTrips: newTrips })
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nights</label>
                            <input
                              type="number"
                              value={trip.nights || ''}
                              onChange={(e) => {
                                const newTrips = [...(tripOptions.customTrips || [])]
                                newTrips[tripIndex] = { ...trip, nights: parseInt(e.target.value) || 0 }
                                setTripOptions({ ...tripOptions, customTrips: newTrips })
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
                            <input
                              type="number"
                              value={trip.days || ''}
                              onChange={(e) => {
                                const newTrips = [...(tripOptions.customTrips || [])]
                                newTrips[tripIndex] = { ...trip, days: parseInt(e.target.value) || 0 }
                                setTripOptions({ ...tripOptions, customTrips: newTrips })
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                            <input
                              type="text"
                              value={trip.price || ''}
                              onChange={(e) => {
                                const newTrips = [...(tripOptions.customTrips || [])]
                                newTrips[tripIndex] = { ...trip, price: e.target.value }
                                setTripOptions({ ...tripOptions, customTrips: newTrips })
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <input
                              type="checkbox"
                              id={`trending-custom-${tripIndex}`}
                              checked={trip.trending || false}
                              onChange={(e) => {
                                const newTrips = [...(tripOptions.customTrips || [])]
                                newTrips[tripIndex] = { ...trip, trending: e.target.checked }
                                setTripOptions({ ...tripOptions, customTrips: newTrips })
                              }}
                              className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor={`trending-custom-${tripIndex}`} className="text-sm font-medium text-gray-700">Trending</label>
                          </div>
                        </div>

                        {/* Detailed Itinerary Section */}
                        <div className="mt-6 border-t border-gray-200 pt-4">
                          <h5 className="text-sm font-semibold text-gray-800 mb-3">Detailed Itinerary</h5>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Itinerary Subtitle</label>
                              <input
                                type="text"
                                value={trip.detailedItinerary?.subtitle || ''}
                                onChange={(e) => {
                                  const newTrips = [...(tripOptions.customTrips || [])]
                                  newTrips[tripIndex] = {
                                    ...trip,
                                    detailedItinerary: {
                                      ...trip.detailedItinerary,
                                      subtitle: e.target.value,
                                      briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                      keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                      inclusions: trip.detailedItinerary?.inclusions || []
                                    }
                                  }
                                  setTripOptions({ ...tripOptions, customTrips: newTrips })
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                                placeholder="Custom Travel Experience"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Itinerary Header Image</label>
                              <div className="flex items-center gap-4">
                                {trip.detailedItinerary?.headerImage && (
                                  <div className="relative w-16 h-10 rounded border border-gray-300 overflow-hidden bg-gray-100 p-0.5">
                                    <Image
                                      src={trip.detailedItinerary.headerImage}
                                      alt="Header"
                                      fill
                                      className="object-cover"
                                      unoptimized={true}
                                    />
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      await handleImageUpload(file, (url) => {
                                        const newTrips = [...(tripOptions.customTrips || [])]
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            ...trip.detailedItinerary,
                                            headerImage: url,
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                            keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                            inclusions: trip.detailedItinerary?.inclusions || []
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, customTrips: newTrips })
                                      })
                                    }
                                  }}
                                  className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-xs bg-white text-black"
                                />
                              </div>
                            </div>

                            {/* Brief Itinerary */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Brief Itinerary</label>
                              <div className="space-y-2">
                                {(trip.detailedItinerary?.briefItinerary || []).map((day, dayIndex) => (
                                  <div key={dayIndex} className="flex gap-2 items-center">
                                    <input
                                      type="number"
                                      value={day.day}
                                      onChange={(e) => {
                                        const newTrips = [...(tripOptions.customTrips || [])]
                                        const newItinerary = [...(trip.detailedItinerary?.briefItinerary || [])]
                                        newItinerary[dayIndex] = { ...day, day: parseInt(e.target.value) || 1 }
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: newItinerary,
                                            keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                            inclusions: trip.detailedItinerary?.inclusions || []
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, customTrips: newTrips })
                                      }}
                                      className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                                      placeholder="Day"
                                    />
                                    <input
                                      type="text"
                                      value={day.title}
                                      onChange={(e) => {
                                        const newTrips = [...(tripOptions.customTrips || [])]
                                        const newItinerary = [...(trip.detailedItinerary?.briefItinerary || [])]
                                        newItinerary[dayIndex] = { ...day, title: e.target.value }
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: newItinerary,
                                            keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                            inclusions: trip.detailedItinerary?.inclusions || []
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, customTrips: newTrips })
                                      }}
                                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                                      placeholder="Day title"
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => {
                                          if (dayIndex > 0) {
                                            const newTrips = [...(tripOptions.customTrips || [])]
                                            const newItinerary = [...(trip.detailedItinerary?.briefItinerary || [])];
                                            [newItinerary[dayIndex], newItinerary[dayIndex - 1]] = [newItinerary[dayIndex - 1], newItinerary[dayIndex]];
                                            // Re-index days to be 1, 2, 3...
                                            const updatedItinerary = newItinerary.map((d, i) => ({ ...d, day: i + 1 }));
                                            newTrips[tripIndex] = {
                                              ...trip,
                                              detailedItinerary: {
                                                subtitle: trip.detailedItinerary?.subtitle || '',
                                                headerImage: trip.detailedItinerary?.headerImage,
                                                briefItinerary: updatedItinerary,
                                                keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                                inclusions: trip.detailedItinerary?.inclusions || []
                                              }
                                            }
                                            setTripOptions({ ...tripOptions, customTrips: newTrips })
                                          }
                                        }}
                                        disabled={dayIndex === 0}
                                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-20"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (dayIndex < (trip.detailedItinerary?.briefItinerary?.length || 0) - 1) {
                                            const newTrips = [...(tripOptions.customTrips || [])]
                                            const newItinerary = [...(trip.detailedItinerary?.briefItinerary || [])];
                                            [newItinerary[dayIndex], newItinerary[dayIndex + 1]] = [newItinerary[dayIndex + 1], newItinerary[dayIndex]];
                                            // Re-index days to be 1, 2, 3...
                                            const updatedItinerary = newItinerary.map((d, i) => ({ ...d, day: i + 1 }));
                                            newTrips[tripIndex] = {
                                              ...trip,
                                              detailedItinerary: {
                                                subtitle: trip.detailedItinerary?.subtitle || '',
                                                headerImage: trip.detailedItinerary?.headerImage,
                                                briefItinerary: updatedItinerary,
                                                keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                                inclusions: trip.detailedItinerary?.inclusions || []
                                              }
                                            }
                                            setTripOptions({ ...tripOptions, customTrips: newTrips })
                                          }
                                        }}
                                        disabled={dayIndex === (trip.detailedItinerary?.briefItinerary?.length || 0) - 1}
                                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-20"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const newTrips = [...(tripOptions.customTrips || [])]
                                        const newItinerary = (trip.detailedItinerary?.briefItinerary || []).filter((_, i) => i !== dayIndex)
                                        // Re-index days to be 1, 2, 3...
                                        const updatedItinerary = newItinerary.map((d, i) => ({ ...d, day: i + 1 }));
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: updatedItinerary,
                                            keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                            inclusions: trip.detailedItinerary?.inclusions || []
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, customTrips: newTrips })
                                      }}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newTrips = [...(tripOptions.customTrips || [])]
                                    const nextDay = (trip.detailedItinerary?.briefItinerary?.length || 0) + 1
                                    const newItinerary = [...(trip.detailedItinerary?.briefItinerary || []), { day: nextDay, title: '', description: '' }]
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: newItinerary,
                                        keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                        inclusions: trip.detailedItinerary?.inclusions || []
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, customTrips: newTrips })
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  + Add Day
                                </button>
                              </div>
                            </div>

                            {/* Key Attractions */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Key Attractions</label>
                              <div className="space-y-2">
                                {(trip.detailedItinerary?.keyAttractions || []).map((attraction, attractionIndex) => (
                                  <div key={attractionIndex} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={attraction}
                                      onChange={(e) => {
                                        const newTrips = [...(tripOptions.customTrips || [])]
                                        const newAttractions = [...(trip.detailedItinerary?.keyAttractions || [])]
                                        newAttractions[attractionIndex] = e.target.value
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                            keyAttractions: newAttractions,
                                            inclusions: trip.detailedItinerary?.inclusions || []
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, customTrips: newTrips })
                                      }}
                                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                                      placeholder="Key attraction"
                                    />
                                    <button
                                      onClick={() => {
                                        const newTrips = [...(tripOptions.customTrips || [])]
                                        const newAttractions = (trip.detailedItinerary?.keyAttractions || []).filter((_, i) => i !== attractionIndex)
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                            keyAttractions: newAttractions,
                                            inclusions: trip.detailedItinerary?.inclusions || []
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, customTrips: newTrips })
                                      }}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newTrips = [...(tripOptions.customTrips || [])]
                                    const newAttractions = [...(trip.detailedItinerary?.keyAttractions || []), '']
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                        keyAttractions: newAttractions,
                                        inclusions: trip.detailedItinerary?.inclusions || []
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, customTrips: newTrips })
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  + Add Attraction
                                </button>
                              </div>
                            </div>

                            {/* Inclusions */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">Inclusions</label>
                                <label className="flex items-center gap-2 text-sm text-gray-600">
                                  <input
                                    type="checkbox"
                                    checked={trip.detailedItinerary?.showInclusions !== false}
                                    onChange={(e) => {
                                      const newTrips = [...(tripOptions.customTrips || [])]
                                      newTrips[tripIndex] = {
                                        ...trip,
                                        detailedItinerary: {
                                          subtitle: trip.detailedItinerary?.subtitle || '',
                                          briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                          keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                          inclusions: trip.detailedItinerary?.inclusions || [],
                                          showInclusions: e.target.checked
                                        }
                                      }
                                      setTripOptions({ ...tripOptions, customTrips: newTrips })
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span>Show Inclusions Section</span>
                                </label>
                              </div>
                              <div className="space-y-2">
                                {(trip.detailedItinerary?.inclusions || []).map((inclusion, inclusionIndex) => (
                                  <div key={inclusionIndex} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={inclusion}
                                      onChange={(e) => {
                                        const newTrips = [...(tripOptions.customTrips || [])]
                                        const newInclusions = [...(trip.detailedItinerary?.inclusions || [])]
                                        newInclusions[inclusionIndex] = e.target.value
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                            keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                            inclusions: newInclusions,
                                            showInclusions: trip.detailedItinerary?.showInclusions !== false
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, customTrips: newTrips })
                                      }}
                                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                                      placeholder="Inclusion"
                                    />
                                    <button
                                      onClick={() => {
                                        const newTrips = [...(tripOptions.customTrips || [])]
                                        const newInclusions = (trip.detailedItinerary?.inclusions || []).filter((_, i) => i !== inclusionIndex)
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                            keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                            inclusions: newInclusions,
                                            showInclusions: trip.detailedItinerary?.showInclusions !== false
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, customTrips: newTrips })
                                      }}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newTrips = [...(tripOptions.customTrips || [])]
                                    const newInclusions = [...(trip.detailedItinerary?.inclusions || []), '']
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                        keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                        inclusions: newInclusions,
                                        showInclusions: trip.detailedItinerary?.showInclusions !== false
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, customTrips: newTrips })
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  + Add Inclusion
                                </button>
                              </div>
                            </div>

                            {/* Feature Tags (Cards) */}
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Feature Tags (Display on Cards)</label>
                              <div className="space-y-2">
                                {(trip.features || []).map((feature, featureIndex) => (
                                  <div key={featureIndex} className="flex gap-2 items-center bg-gray-50 p-2 rounded-md border border-gray-100">
                                    <input
                                      type="text"
                                      value={feature.name}
                                      onChange={(e) => {
                                        const newTrips = [...(tripOptions.customTrips || [])]
                                        const newFeatures = [...(trip.features || [])]
                                        newFeatures[featureIndex] = { ...feature, name: e.target.value }
                                        newTrips[tripIndex] = { ...trip, features: newFeatures }
                                        setTripOptions({ ...tripOptions, customTrips: newTrips })
                                      }}
                                      className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm text-black bg-white"
                                      placeholder="Feature name"
                                    />
                                    <select
                                      value={feature.icon}
                                      onChange={(e) => {
                                        const newTrips = [...(tripOptions.customTrips || [])]
                                        const newFeatures = [...(trip.features || [])]
                                        newFeatures[featureIndex] = { ...feature, icon: e.target.value as any }
                                        newTrips[tripIndex] = { ...trip, features: newFeatures }
                                        setTripOptions({ ...tripOptions, customTrips: newTrips })
                                      }}
                                      className="w-28 border border-gray-300 rounded-md px-2 py-1.5 text-xs text-black bg-white"
                                    >
                                      <option value="default">Checkmark</option>
                                      <option value="flights">Flights</option>
                                      <option value="bus">Bus</option>
                                      <option value="train">Train</option>
                                    </select>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={feature.included}
                                        onChange={(e) => {
                                          const newTrips = [...(tripOptions.customTrips || [])]
                                          const newFeatures = [...(trip.features || [])]
                                          newFeatures[featureIndex] = { ...feature, included: e.target.checked }
                                          newTrips[tripIndex] = { ...trip, features: newFeatures }
                                          setTripOptions({ ...tripOptions, customTrips: newTrips })
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-xs text-gray-700 whitespace-nowrap font-medium">Included</span>
                                    </label>
                                    <button
                                      onClick={() => {
                                        const newTrips = [...(tripOptions.customTrips || [])]
                                        const newFeatures = (trip.features || []).filter((_, i) => i !== featureIndex)
                                        newTrips[tripIndex] = { ...trip, features: newFeatures }
                                        setTripOptions({ ...tripOptions, customTrips: newTrips })
                                      }}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newTrips = [...(tripOptions.customTrips || [])]
                                    const newFeatures = [...(trip.features || []), { name: '', icon: 'default' as const, included: true }]
                                    newTrips[tripIndex] = { ...trip, features: newFeatures }
                                    setTripOptions({ ...tripOptions, customTrips: newTrips })
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  + Add Feature Tag
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Group Trips Section */}
            <div className="mt-6 pt-6 border-t-2 border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900">Group Departures</h3>
              </div>

              {/* Group Trip Selector Dropdown */}
              <div className="mb-4">
                <select
                  value={selectedGroupTrip}
                  onChange={(e) => setSelectedGroupTrip(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                >
                  <option value="">Select a group trip to edit</option>
                  {(tripOptions.groupTrips || []).map((trip, index) => (
                    <option key={trip.id} value={trip.id}>
                      Group Trip {index + 1} - {trip.title || 'Untitled Trip'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add New Group Trip Button */}
              <div className="mb-4">
                <button
                  onClick={() => {
                    const newTrip: TripOption = {
                      id: `group-${Date.now()}`,
                      title: 'New Group Trip',
                      description: 'Group trip description',
                      image: '/cards/1.jpg',
                      nights: 3,
                      days: 4,
                      price: 12000,
                      category: 'group',
                      route: '',
                      trending: false,
                      detailedItinerary: {
                        subtitle: 'Group Travel Experience',
                        headerImage: '',
                        briefItinerary: [
                          { day: 1, title: '', description: '' }
                        ],
                        keyAttractions: [],
                        inclusions: [],
                        showInclusions: true
                      },
                      features: [
                        { name: 'Sightseeing', icon: 'default' as const, included: true },
                        { name: 'Transfers', icon: 'default' as const, included: true },
                        { name: 'Meals', icon: 'default' as const, included: true },
                        { name: 'Stay', icon: 'default' as const, included: true },
                        { name: 'Trip Assistance', icon: 'default' as const, included: true },
                        { name: 'Flights', icon: 'flights' as const, included: false }
                      ]
                    }
                    setTripOptions({ ...tripOptions, groupTrips: [...(tripOptions.groupTrips || []), newTrip] })
                    setSelectedGroupTrip(newTrip.id)
                  }}
                  className="w-full py-2 text-sm border-2 border-dashed border-gray-200 rounded-md text-gray-600 hover:border-gray-300 hover:text-gray-700 transition-colors"
                >
                  Add New Group Trip
                </button>
              </div>

              {/* Selected Group Trip Edit Form */}
              {selectedGroupTrip && tripOptions.groupTrips?.find(t => t.id === selectedGroupTrip) && (
                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  {(() => {
                    const trip = tripOptions.groupTrips?.find(t => t.id === selectedGroupTrip)!
                    const tripIndex = tripOptions.groupTrips?.findIndex(t => t.id === selectedGroupTrip) || 0

                    return (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-4">
                            <h4 className="text-md font-medium text-gray-800">Group Trip {tripIndex + 1}</h4>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  if (tripIndex > 0) {
                                    const newTrips = [...(tripOptions.groupTrips || [])];
                                    [newTrips[tripIndex], newTrips[tripIndex - 1]] = [newTrips[tripIndex - 1], newTrips[tripIndex]];
                                    setTripOptions({ ...tripOptions, groupTrips: newTrips });
                                  }
                                }}
                                disabled={tripIndex === 0}
                                className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                title="Move Up"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                              </button>
                              <button
                                onClick={() => {
                                  if (tripIndex < (tripOptions.groupTrips?.length || 0) - 1) {
                                    const newTrips = [...(tripOptions.groupTrips || [])];
                                    [newTrips[tripIndex], newTrips[tripIndex + 1]] = [newTrips[tripIndex + 1], newTrips[tripIndex]];
                                    setTripOptions({ ...tripOptions, groupTrips: newTrips });
                                  }
                                }}
                                disabled={tripIndex === (tripOptions.groupTrips?.length || 0) - 1}
                                className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                title="Move Down"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                              </button>
                              <button
                                onClick={() => {
                                  const newTrip = JSON.parse(JSON.stringify(trip));
                                  newTrip.id = `group-${Date.now()}`;
                                  newTrip.title = `${newTrip.title} (Copy)`;
                                  const newTrips = [...(tripOptions.groupTrips || []), newTrip];
                                  setTripOptions({ ...tripOptions, groupTrips: newTrips });
                                  setSelectedGroupTrip(newTrip.id);
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded border border-blue-200 ml-2"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                Duplicate
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setTripOptions({
                                ...tripOptions,
                                groupTrips: (tripOptions.groupTrips || []).filter(t => t.id !== selectedGroupTrip)
                              })
                              setSelectedGroupTrip('')
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove Trip
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trip Title</label>
                            <input
                              type="text"
                              value={trip.title}
                              onChange={(e) => {
                                const newTrips = [...(tripOptions.groupTrips || [])]
                                newTrips[tripIndex] = { ...trip, title: e.target.value }
                                setTripOptions({ ...tripOptions, groupTrips: newTrips })
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={trip.description}
                              onChange={(e) => {
                                const newTrips = [...(tripOptions.groupTrips || [])]
                                newTrips[tripIndex] = { ...trip, description: e.target.value }
                                setTripOptions({ ...tripOptions, groupTrips: newTrips })
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trip Image</label>
                            <div className="flex items-center gap-4">
                              {trip.image && (
                                <div className="relative w-16 h-16 rounded-lg border border-gray-300 overflow-hidden">
                                  <Image
                                    src={trip.image}
                                    alt={trip.title}
                                    fill
                                    className="object-cover"
                                    unoptimized={true}
                                  />
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    // Check file size (4MB limit)
                                    const maxSize = 4 * 1024 * 1024 // 4MB
                                    if (file.size > maxSize) {
                                      alert(`File too large. Maximum size is 4MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please compress the image and try again.`)
                                      return
                                    }

                                    try {
                                      const formData = new FormData()
                                      formData.append('file', file)
                                      formData.append('path', `trip-options/${citySlug}/group-${trip.id}`)

                                      const uploadData = await fetchApi<{ url: string; error?: string }>('/api/upload', {
                                        method: 'POST',
                                        body: formData
                                      })

                                      if (uploadData.url) {
                                        const { url } = uploadData
                                        const newTrips = [...(tripOptions.groupTrips || [])]
                                        newTrips[tripIndex] = { ...trip, image: url }
                                        setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                      } else {
                                        const errorData = uploadData
                                        console.error('Upload failed:', errorData)
                                        alert(`Upload failed: ${errorData.error || 'Unknown error'}`)
                                      }
                                    } catch (error) {
                                      console.error('Upload error:', error)
                                      alert('Upload failed. Please try again.')
                                    }
                                  }
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                            <input
                              type="text"
                              value={trip.route || ''}
                              onChange={(e) => {
                                const newTrips = [...(tripOptions.groupTrips || [])]
                                newTrips[tripIndex] = { ...trip, route: e.target.value }
                                setTripOptions({ ...tripOptions, groupTrips: newTrips })
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nights</label>
                            <input
                              type="number"
                              value={trip.nights || ''}
                              onChange={(e) => {
                                const newTrips = [...(tripOptions.groupTrips || [])]
                                newTrips[tripIndex] = { ...trip, nights: parseInt(e.target.value) || 0 }
                                setTripOptions({ ...tripOptions, groupTrips: newTrips })
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
                            <input
                              type="number"
                              value={trip.days || ''}
                              onChange={(e) => {
                                const newTrips = [...(tripOptions.groupTrips || [])]
                                newTrips[tripIndex] = { ...trip, days: parseInt(e.target.value) || 0 }
                                setTripOptions({ ...tripOptions, groupTrips: newTrips })
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                            <input
                              type="text"
                              value={trip.price || ''}
                              onChange={(e) => {
                                const newTrips = [...(tripOptions.groupTrips || [])]
                                newTrips[tripIndex] = { ...trip, price: e.target.value }
                                setTripOptions({ ...tripOptions, groupTrips: newTrips })
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <input
                              type="checkbox"
                              id={`trending-group-${tripIndex}`}
                              checked={trip.trending || false}
                              onChange={(e) => {
                                const newTrips = [...(tripOptions.groupTrips || [])]
                                newTrips[tripIndex] = { ...trip, trending: e.target.checked }
                                setTripOptions({ ...tripOptions, groupTrips: newTrips })
                              }}
                              className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor={`trending-group-${tripIndex}`} className="text-sm font-medium text-gray-700">Trending</label>
                          </div>
                        </div>

                        {/* Detailed Itinerary Section */}
                        <div className="mt-6 border-t border-gray-200 pt-4">
                          <h5 className="text-sm font-semibold text-gray-800 mb-3">Detailed Itinerary</h5>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Itinerary Subtitle</label>
                              <input
                                type="text"
                                value={trip.detailedItinerary?.subtitle || ''}
                                onChange={(e) => {
                                  const newTrips = [...(tripOptions.groupTrips || [])]
                                  newTrips[tripIndex] = {
                                    ...trip,
                                    detailedItinerary: {
                                      ...trip.detailedItinerary,
                                      subtitle: e.target.value,
                                      briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                      keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                      inclusions: trip.detailedItinerary?.inclusions || []
                                    }
                                  }
                                  setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                                placeholder="Group Travel Experience"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Itinerary Header Image</label>
                              <div className="flex items-center gap-4">
                                {trip.detailedItinerary?.headerImage && (
                                  <div className="relative w-16 h-10 rounded border border-gray-300 overflow-hidden bg-gray-100 p-0.5">
                                    <Image
                                      src={trip.detailedItinerary.headerImage}
                                      alt="Header"
                                      fill
                                      className="object-cover"
                                      unoptimized={true}
                                    />
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      await handleImageUpload(file, (url) => {
                                        const newTrips = [...(tripOptions.groupTrips || [])]
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            ...trip.detailedItinerary,
                                            headerImage: url,
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                            keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                            inclusions: trip.detailedItinerary?.inclusions || []
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                      })
                                    }
                                  }}
                                  className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-xs bg-white text-black"
                                />
                              </div>
                            </div>

                            {/* Brief Itinerary */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Brief Itinerary</label>
                              <div className="space-y-2">
                                {(trip.detailedItinerary?.briefItinerary || []).map((day, dayIndex) => (
                                  <div key={dayIndex} className="flex gap-2 items-center">
                                    <input
                                      type="number"
                                      value={day.day}
                                      onChange={(e) => {
                                        const newTrips = [...(tripOptions.groupTrips || [])]
                                        const newItinerary = [...(trip.detailedItinerary?.briefItinerary || [])]
                                        newItinerary[dayIndex] = { ...day, day: parseInt(e.target.value) || 1 }
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: newItinerary,
                                            keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                            inclusions: trip.detailedItinerary?.inclusions || []
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                      }}
                                      className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                                      placeholder="Day"
                                    />
                                    <input
                                      type="text"
                                      value={day.title}
                                      onChange={(e) => {
                                        const newTrips = [...(tripOptions.groupTrips || [])]
                                        const newItinerary = [...(trip.detailedItinerary?.briefItinerary || [])]
                                        newItinerary[dayIndex] = { ...day, title: e.target.value }
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: newItinerary,
                                            keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                            inclusions: trip.detailedItinerary?.inclusions || []
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                      }}
                                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                                      placeholder="Day title"
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => {
                                          if (dayIndex > 0) {
                                            const newTrips = [...(tripOptions.groupTrips || [])]
                                            const newItinerary = [...(trip.detailedItinerary?.briefItinerary || [])];
                                            [newItinerary[dayIndex], newItinerary[dayIndex - 1]] = [newItinerary[dayIndex - 1], newItinerary[dayIndex]];
                                            // Re-index days
                                            const updatedItinerary = newItinerary.map((d, i) => ({ ...d, day: i + 1 }));
                                            newTrips[tripIndex] = {
                                              ...trip,
                                              detailedItinerary: {
                                                subtitle: trip.detailedItinerary?.subtitle || '',
                                                headerImage: trip.detailedItinerary?.headerImage,
                                                briefItinerary: updatedItinerary,
                                                keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                                inclusions: trip.detailedItinerary?.inclusions || []
                                              }
                                            }
                                            setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                          }
                                        }}
                                        disabled={dayIndex === 0}
                                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-20"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (dayIndex < (trip.detailedItinerary?.briefItinerary?.length || 0) - 1) {
                                            const newTrips = [...(tripOptions.groupTrips || [])]
                                            const newItinerary = [...(trip.detailedItinerary?.briefItinerary || [])];
                                            [newItinerary[dayIndex], newItinerary[dayIndex + 1]] = [newItinerary[dayIndex + 1], newItinerary[dayIndex]];
                                            // Re-index days
                                            const updatedItinerary = newItinerary.map((d, i) => ({ ...d, day: i + 1 }));
                                            newTrips[tripIndex] = {
                                              ...trip,
                                              detailedItinerary: {
                                                subtitle: trip.detailedItinerary?.subtitle || '',
                                                headerImage: trip.detailedItinerary?.headerImage,
                                                briefItinerary: updatedItinerary,
                                                keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                                inclusions: trip.detailedItinerary?.inclusions || []
                                              }
                                            }
                                            setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                          }
                                        }}
                                        disabled={dayIndex === (trip.detailedItinerary?.briefItinerary?.length || 0) - 1}
                                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-20"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const newTrips = [...(tripOptions.groupTrips || [])]
                                        const newItinerary = (trip.detailedItinerary?.briefItinerary || []).filter((_, i) => i !== dayIndex)
                                        // Re-index days
                                        const updatedItinerary = newItinerary.map((d, i) => ({ ...d, day: i + 1 }));
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: updatedItinerary,
                                            keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                            inclusions: trip.detailedItinerary?.inclusions || []
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                      }}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newTrips = [...(tripOptions.groupTrips || [])]
                                    const nextDay = (trip.detailedItinerary?.briefItinerary?.length || 0) + 1
                                    const newItinerary = [...(trip.detailedItinerary?.briefItinerary || []), { day: nextDay, title: '', description: '' }]
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: newItinerary,
                                        keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                        inclusions: trip.detailedItinerary?.inclusions || []
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  + Add Day
                                </button>
                              </div>
                            </div>

                            {/* Key Attractions */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Key Attractions</label>
                              <div className="space-y-2">
                                {(trip.detailedItinerary?.keyAttractions || []).map((attraction, attractionIndex) => (
                                  <div key={attractionIndex} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={attraction}
                                      onChange={(e) => {
                                        const newTrips = [...(tripOptions.groupTrips || [])]
                                        const newAttractions = [...(trip.detailedItinerary?.keyAttractions || [])]
                                        newAttractions[attractionIndex] = e.target.value
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                            keyAttractions: newAttractions,
                                            inclusions: trip.detailedItinerary?.inclusions || []
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                      }}
                                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                                      placeholder="Key attraction"
                                    />
                                    <button
                                      onClick={() => {
                                        const newTrips = [...(tripOptions.groupTrips || [])]
                                        const newAttractions = (trip.detailedItinerary?.keyAttractions || []).filter((_, i) => i !== attractionIndex)
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                            keyAttractions: newAttractions,
                                            inclusions: trip.detailedItinerary?.inclusions || []
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                      }}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newTrips = [...(tripOptions.groupTrips || [])]
                                    const newAttractions = [...(trip.detailedItinerary?.keyAttractions || []), '']
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                        keyAttractions: newAttractions,
                                        inclusions: trip.detailedItinerary?.inclusions || []
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  + Add Attraction
                                </button>
                              </div>
                            </div>

                            {/* Inclusions */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">Inclusions</label>
                                <label className="flex items-center gap-2 text-sm text-gray-600">
                                  <input
                                    type="checkbox"
                                    checked={trip.detailedItinerary?.showInclusions !== false}
                                    onChange={(e) => {
                                      const newTrips = [...(tripOptions.groupTrips || [])]
                                      newTrips[tripIndex] = {
                                        ...trip,
                                        detailedItinerary: {
                                          subtitle: trip.detailedItinerary?.subtitle || '',
                                          briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                          keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                          inclusions: trip.detailedItinerary?.inclusions || [],
                                          showInclusions: e.target.checked
                                        }
                                      }
                                      setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span>Show Inclusions Section</span>
                                </label>
                              </div>
                              <div className="space-y-2">
                                {(trip.detailedItinerary?.inclusions || []).map((inclusion, inclusionIndex) => (
                                  <div key={inclusionIndex} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={inclusion}
                                      onChange={(e) => {
                                        const newTrips = [...(tripOptions.groupTrips || [])]
                                        const newInclusions = [...(trip.detailedItinerary?.inclusions || [])]
                                        newInclusions[inclusionIndex] = e.target.value
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                            keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                            inclusions: newInclusions
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                      }}
                                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                                      placeholder="Inclusion"
                                    />
                                    <button
                                      onClick={() => {
                                        const newTrips = [...(tripOptions.groupTrips || [])]
                                        const newInclusions = (trip.detailedItinerary?.inclusions || []).filter((_, i) => i !== inclusionIndex)
                                        newTrips[tripIndex] = {
                                          ...trip,
                                          detailedItinerary: {
                                            subtitle: trip.detailedItinerary?.subtitle || '',
                                            briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                            keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                            inclusions: newInclusions
                                          }
                                        }
                                        setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                      }}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newTrips = [...(tripOptions.groupTrips || [])]
                                    const newInclusions = [...(trip.detailedItinerary?.inclusions || []), '']
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                        keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                        inclusions: newInclusions
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  + Add Inclusion
                                </button>
                              </div>
                            </div>

                            {/* Feature Tags (Cards) */}
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Feature Tags (Display on Cards)</label>
                              <div className="space-y-2">
                                {(trip.features || []).map((feature, featureIndex) => (
                                  <div key={featureIndex} className="flex gap-2 items-center bg-gray-50 p-2 rounded-md border border-gray-100">
                                    <input
                                      type="text"
                                      value={feature.name}
                                      onChange={(e) => {
                                        const newTrips = [...(tripOptions.groupTrips || [])]
                                        const newFeatures = [...(trip.features || [])]
                                        newFeatures[featureIndex] = { ...feature, name: e.target.value }
                                        newTrips[tripIndex] = { ...trip, features: newFeatures }
                                        setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                      }}
                                      className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm text-black bg-white"
                                      placeholder="Feature name"
                                    />
                                    <select
                                      value={feature.icon}
                                      onChange={(e) => {
                                        const newTrips = [...(tripOptions.groupTrips || [])]
                                        const newFeatures = [...(trip.features || [])]
                                        newFeatures[featureIndex] = { ...feature, icon: e.target.value as any }
                                        newTrips[tripIndex] = { ...trip, features: newFeatures }
                                        setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                      }}
                                      className="w-28 border border-gray-300 rounded-md px-2 py-1.5 text-xs text-black bg-white"
                                    >
                                      <option value="default">Checkmark</option>
                                      <option value="flights">Flights</option>
                                      <option value="bus">Bus</option>
                                      <option value="train">Train</option>
                                    </select>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={feature.included}
                                        onChange={(e) => {
                                          const newTrips = [...(tripOptions.groupTrips || [])]
                                          const newFeatures = [...(trip.features || [])]
                                          newFeatures[featureIndex] = { ...feature, included: e.target.checked }
                                          newTrips[tripIndex] = { ...trip, features: newFeatures }
                                          setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-xs text-gray-700 whitespace-nowrap font-medium">Included</span>
                                    </label>
                                    <button
                                      onClick={() => {
                                        const newTrips = [...(tripOptions.groupTrips || [])]
                                        const newFeatures = (trip.features || []).filter((_, i) => i !== featureIndex)
                                        newTrips[tripIndex] = { ...trip, features: newFeatures }
                                        setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                      }}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newTrips = [...(tripOptions.groupTrips || [])]
                                    const newFeatures = [...(trip.features || []), { name: '', icon: 'default' as const, included: true }]
                                    newTrips[tripIndex] = { ...trip, features: newFeatures }
                                    setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  + Add Feature Tag
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )
      }

      {/* Reviews Section */}
      {
        isSectionVisible('reviews') && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Section Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">4. Reviews Section</h2>
                    <p className="text-xs text-gray-500">Customer testimonials & feedback</p>
                  </div>
                </div>
                <button
                  onClick={() => saveSection('Reviews', { reviews })}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-800 hover:bg-slate-700 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Section Content */}
            <div className="p-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Heading
                  </label>
                  <input
                    type="text"
                    value={reviews.heading}
                    onChange={(e) => setReviews(prev => ({ ...prev, heading: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                    placeholder="Reviews heading"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Subheading
                  </label>
                  <input
                    type="text"
                    value={reviews.subheading}
                    onChange={(e) => setReviews(prev => ({ ...prev, subheading: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                    placeholder="Reviews subheading"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Reviews ({reviews.reviews.length})
                  </label>

                  {/* Review Selector Dropdown */}
                  <div className="mb-3">
                    <select
                      value={selectedReview}
                      onChange={(e) => setSelectedReview(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                    >
                      <option value="">Select a review to edit</option>
                      {reviews.reviews.map((review, index) => (
                        <option key={review.id} value={review.id}>
                          Review {index + 1} - {review.name || 'Unnamed Review'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Add New Review Button */}
                  <div className="mb-3">
                    <button
                      onClick={() => {
                        const newReview = {
                          id: Date.now().toString(),
                          name: '',
                          review: '',
                          images: [{ src: '', alt: '' }, { src: '', alt: '' }]
                        }
                        setReviews(prev => ({
                          ...prev,
                          reviews: [...prev.reviews, newReview]
                        }))
                        setSelectedReview(newReview.id)
                      }}
                      className="w-full py-2 text-sm border-2 border-dashed border-gray-200 rounded-md text-gray-600 hover:border-gray-300 hover:text-gray-700 transition-colors"
                    >
                      Add New Review
                    </button>
                  </div>

                  {/* Selected Review Edit Form */}
                  {selectedReview && reviews.reviews.find(r => r.id === selectedReview) && (
                    <div className="border border-gray-200 rounded-md p-3">
                      {(() => {
                        const review = reviews.reviews.find(r => r.id === selectedReview)!
                        const index = reviews.reviews.findIndex(r => r.id === selectedReview)

                        return (
                          <>
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-medium text-gray-800">Review {index + 1}</h4>
                              <button
                                onClick={() => {
                                  setReviews(prev => ({
                                    ...prev,
                                    reviews: prev.reviews.filter(r => r.id !== selectedReview)
                                  }))
                                  setSelectedReview('')
                                }}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={review.name}
                                  onChange={(e) => setReviews(prev => ({
                                    ...prev,
                                    reviews: prev.reviews.map(r =>
                                      r.id === review.id ? { ...r, name: e.target.value } : r
                                    )
                                  }))}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                                  placeholder="Reviewer name"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Review Text
                                </label>
                                <textarea
                                  value={review.review}
                                  onChange={(e) => setReviews(prev => ({
                                    ...prev,
                                    reviews: prev.reviews.map(r =>
                                      r.id === review.id ? { ...r, review: e.target.value } : r
                                    )
                                  }))}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                                  rows={2}
                                  placeholder="Review text"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Image 1
                                  </label>
                                  <div className="space-y-2">
                                    {review.images[0]?.src && (
                                      <div className="relative w-full h-32 rounded-lg border border-gray-300 overflow-hidden bg-gray-50">
                                        <Image
                                          src={review.images[0].src}
                                          alt="Review Image 1"
                                          fill
                                          className="object-cover"
                                          unoptimized={true}
                                        />
                                        <button
                                          onClick={() => setReviews(prev => ({
                                            ...prev,
                                            reviews: prev.reviews.map(r =>
                                              r.id === review.id ? {
                                                ...r,
                                                images: [
                                                  { ...r.images[0], src: '' },
                                                  r.images[1] || { src: '', alt: '' }
                                                ]
                                              } : r
                                            )
                                          }))}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                                          title="Remove image"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                          if (file.size > 4 * 1024 * 1024) {
                                            alert('File too large. Max size is 4MB.')
                                            return
                                          }
                                          await handleImageUpload(file, (url) => {
                                            setReviews(prev => ({
                                              ...prev,
                                              reviews: prev.reviews.map(r =>
                                                r.id === review.id ? {
                                                  ...r,
                                                  images: [
                                                    { ...r.images[0], src: url },
                                                    r.images[1] || { src: '', alt: '' }
                                                  ]
                                                } : r
                                              )
                                            }))
                                          })
                                        }
                                      }}
                                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Image 2
                                  </label>
                                  <div className="space-y-2">
                                    {review.images[1]?.src && (
                                      <div className="relative w-full h-32 rounded-lg border border-gray-300 overflow-hidden bg-gray-50">
                                        <Image
                                          src={review.images[1].src}
                                          alt="Review Image 2"
                                          fill
                                          className="object-cover"
                                          unoptimized={true}
                                        />
                                        <button
                                          onClick={() => setReviews(prev => ({
                                            ...prev,
                                            reviews: prev.reviews.map(r =>
                                              r.id === review.id ? {
                                                ...r,
                                                images: [
                                                  r.images[0] || { src: '', alt: '' },
                                                  { ...r.images[1], src: '' }
                                                ]
                                              } : r
                                            )
                                          }))}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                                          title="Remove image"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                          if (file.size > 4 * 1024 * 1024) {
                                            alert('File too large. Max size is 4MB.')
                                            return
                                          }
                                          await handleImageUpload(file, (url) => {
                                            setReviews(prev => ({
                                              ...prev,
                                              reviews: prev.reviews.map(r =>
                                                r.id === review.id ? {
                                                  ...r,
                                                  images: [
                                                    r.images[0] || { src: '', alt: '' },
                                                    { ...r.images[1], src: url }
                                                  ]
                                                } : r
                                              )
                                            }))
                                          })
                                        }
                                      }}
                                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 bg-white text-black"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* USP Section */}
      {
        isSectionVisible('usp') && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Section Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">5. USP Section</h2>
                    <p className="text-xs text-gray-500">Unique selling points & features</p>
                  </div>
                </div>
                <button
                  onClick={() => saveSection('USP', { usp })}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-800 hover:bg-slate-700 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Section Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heading
                  </label>
                  <input
                    type="text"
                    value={usp.heading}
                    onChange={(e) => setUsp(prev => ({ ...prev, heading: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    placeholder="USP heading"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subheading (Optional)
                  </label>
                  <input
                    type="text"
                    value={usp.subheading || ''}
                    onChange={(e) => setUsp(prev => ({ ...prev, subheading: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    placeholder="USP subheading"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bottom CTA Text
                  </label>
                  <input
                    type="text"
                    value={usp.ctaText || ''}
                    onChange={(e) => setUsp(prev => ({ ...prev, ctaText: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    placeholder="Ready to experience Kashmir like never before?"
                  />
                  <p className="text-xs text-gray-500 mt-1">This text appears at the bottom of the USP section</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select USP Item to Edit
                  </label>
                  <select
                    value={selectedUspItem}
                    onChange={(e) => setSelectedUspItem(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 bg-white text-black"
                  >
                    {usp.items.map((item, index) => (
                      <option key={item.id} value={item.id}>
                        Item {item.id} - {item.title}
                      </option>
                    ))}
                  </select>

                  {/* Debug info */}
                  <div className="text-xs text-gray-500 mb-2">
                    Debug: Found {usp.items.length} items. Items: {usp.items.map(item => `${item.id}(${item.title})`).join(', ')}
                  </div>

                  {(() => {
                    const selectedItem = usp.items.find(item => item.id === selectedUspItem);
                    if (!selectedItem) {
                      return (
                        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                          <p className="text-red-600">Item not found: {selectedUspItem}</p>
                          <p className="text-sm text-red-500">Available items: {usp.items.map(item => item.id).join(', ')}</p>
                        </div>
                      );
                    }

                    return (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="text-md font-medium text-gray-800 mb-3">
                          Editing: Item {selectedUspItem} - {selectedItem.title}
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={selectedItem.title}
                              onChange={(e) => setUsp(prev => ({
                                ...prev,
                                items: prev.items.map(i =>
                                  i.id === selectedUspItem ? { ...i, title: e.target.value } : i
                                )
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                              placeholder="Item title"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              value={selectedItem.description}
                              onChange={(e) => setUsp(prev => ({
                                ...prev,
                                items: prev.items.map(i =>
                                  i.id === selectedUspItem ? { ...i, description: e.target.value } : i
                                )
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                              rows={3}
                              placeholder="Item description"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Brands Section */}
      {
        isSectionVisible('brands') && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Section Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">6. Brands Section</h2>
                    <p className="text-xs text-gray-500">Partner & client logos</p>
                  </div>
                </div>
                <button
                  onClick={() => saveSection('Brands', { brands })}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-800 hover:bg-slate-700 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Section Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
                  <input
                    type="text"
                    value={brands.heading}
                    onChange={(e) => setBrands({ ...brands, heading: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                    placeholder="Brands Who've Worked with Us"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subheading</label>
                  <input
                    type="text"
                    value={brands.subheading || ''}
                    onChange={(e) => setBrands({ ...brands, subheading: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                    placeholder="Corporate clients who trust Travloger for their offsites & escapes"
                  />
                  <p className="text-xs text-gray-500 mt-1">This text appears below the brand logos</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scroll Duration (seconds) - <span className="text-xs text-gray-500 font-normal italic">lower is faster, default is 25</span>
                  </label>
                  <input
                    type="number"
                    value={brands.scrollDuration || 25}
                    onChange={(e) => setBrands({ ...brands, scrollDuration: parseInt(e.target.value) || 25 })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-black bg-white"
                    placeholder="25"
                    min="5"
                    max="120"
                  />
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-semibold text-gray-800">Brand Logos ({brands.brands.length})</h3>
                    <button
                      onClick={() => {
                        const newId = Date.now().toString()
                        setBrands({
                          ...brands,
                          brands: [...brands.brands, {
                            id: newId,
                            name: '',
                            logoUrl: '',
                            width: 120,
                            height: 60
                          }]
                        })
                        setBrandImageFiles(prev => ({ ...prev, [newId]: null }))
                        setSelectedBrand(newId)
                      }}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Add Brand
                    </button>
                  </div>

                  {/* Brand Selector Dropdown */}
                  <div className="mb-4">
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    >
                      <option value="">Select a brand to edit</option>
                      {brands.brands.map((brand, index) => (
                        <option key={brand.id} value={brand.id}>
                          Brand {index + 1} - {brand.name || 'Unnamed Brand'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Brand Edit Form */}
                  {selectedBrand && brands.brands.find(b => b.id === selectedBrand) && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      {(() => {
                        const brand = brands.brands.find(b => b.id === selectedBrand)!
                        const index = brands.brands.findIndex(b => b.id === selectedBrand)

                        return (
                          <>
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-medium text-gray-800">Brand {index + 1}</h4>
                              <button
                                onClick={() => {
                                  setBrands({
                                    ...brands,
                                    brands: brands.brands.filter(b => b.id !== selectedBrand)
                                  })
                                  setBrandImageFiles(prev => {
                                    const newFiles = { ...prev }
                                    delete newFiles[selectedBrand]
                                    return newFiles
                                  })
                                  setSelectedBrand('')
                                }}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Brand Name</label>
                                <input
                                  type="text"
                                  value={brand.name}
                                  onChange={(e) => setBrands({
                                    ...brands,
                                    brands: brands.brands.map(b =>
                                      b.id === brand.id ? { ...b, name: e.target.value } : b
                                    )
                                  })}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                                  placeholder="Microsoft"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Logo Image</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      // Check file size (4MB limit)
                                      const maxSize = 50 * 1024 * 1024 // 50MB
                                      if (file.size > maxSize) {
                                        alert(`File too large. Maximum size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please compress the image and try again.`)
                                        return
                                      }

                                      try {
                                        const formData = new FormData()
                                        formData.append('file', file)
                                        formData.append('path', `brands/${brand.id}`)

                                        const uploadData = await fetchApi<{ url: string; error?: string }>('/api/upload', {
                                          method: 'POST',
                                          body: formData
                                        })

                                        if (uploadData.url) {
                                          const { url } = uploadData
                                          setBrandImageFiles(prev => ({ ...prev, [brand.id]: file }))
                                          setBrands({
                                            ...brands,
                                            brands: brands.brands.map(b =>
                                              b.id === brand.id ? { ...b, logoUrl: url } : b
                                            )
                                          })
                                        } else {
                                          const errorData = uploadData
                                          console.error('Upload failed:', errorData)
                                          alert(`Upload failed: ${errorData.error || 'Unknown error'}`)
                                        }
                                      } catch (error) {
                                        console.error('Upload error:', error)
                                        alert('Upload failed. Please try again.')
                                      }
                                    }
                                  }}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                                />
                                {brand.logoUrl && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Current: {brand.logoUrl.startsWith('data:') ? 'Uploaded image' : 'URL image'}
                                  </p>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Width (px)</label>
                                  <input
                                    type="number"
                                    value={brand.width || 120}
                                    onChange={(e) => setBrands({
                                      ...brands,
                                      brands: brands.brands.map(b =>
                                        b.id === brand.id ? { ...b, width: parseInt(e.target.value) || 120 } : b
                                      )
                                    })}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                                    min="50"
                                    max="500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Height (px)</label>
                                  <input
                                    type="number"
                                    value={brand.height || 60}
                                    onChange={(e) => setBrands({
                                      ...brands,
                                      brands: brands.brands.map(b =>
                                        b.id === brand.id ? { ...b, height: parseInt(e.target.value) || 60 } : b
                                      )
                                    })}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                                    min="30"
                                    max="200"
                                  />
                                </div>
                              </div>

                              {brand.logoUrl && (
                                <div className="mt-2">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Preview</label>
                                  <div className="w-24 h-12 border border-gray-200 rounded-md flex items-center justify-center bg-gray-50">
                                    <div className="relative w-full h-full">
                                      <Image
                                        src={brand.logoUrl}
                                        alt={brand.name || 'Brand logo'}
                                        fill
                                        className="object-contain"
                                        unoptimized
                                      />
                                    </div>
                                  </div>
                                  <div className="mt-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBrands({
                                          ...brands,
                                          brands: brands.brands.map(b =>
                                            b.id === brand.id ? { ...b, logoUrl: '' } : b
                                          )
                                        })
                                        setBrandImageFiles(prev => ({ ...prev, [brand.id]: null }))
                                      }}
                                      className="text-xs text-red-600 hover:text-red-800"
                                    >
                                      Remove Image
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* FAQ Section */}
      {
        isSectionVisible('faq') && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Section Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">7. FAQ Section</h2>
                    <p className="text-xs text-gray-500">Frequently asked questions</p>
                  </div>
                </div>
                <button
                  onClick={() => saveSection('FAQ', { faq })}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-800 hover:bg-slate-700 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Section Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
                  <input
                    type="text"
                    value={faq.heading}
                    onChange={(e) => setFaq({ ...faq, heading: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-black"
                    placeholder="Before You Pack, Read This FAQs."
                  />
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-semibold text-gray-800">FAQ Items</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select FAQ Item to Edit</label>
                      <select
                        value={selectedFaqItem}
                        onChange={(e) => setSelectedFaqItem(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 bg-white text-black"
                      >
                        {faq.items.map((item, index) => (
                          <option key={item.id} value={item.id}>
                            Item {item.id} - {item.question.substring(0, 50)}...
                          </option>
                        ))}
                      </select>

                      {/* Debug info */}
                      <div className="text-xs text-gray-500 mb-2">
                        Debug: Found {faq.items.length} items. Items: {faq.items.map(item => `${item.id}(${item.question.substring(0, 20)}...)`).join(', ')}
                      </div>

                      {(() => {
                        const selectedItem = faq.items.find(item => item.id === selectedFaqItem);
                        if (!selectedItem) {
                          return (
                            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                              <p className="text-red-600">Item not found: {selectedFaqItem}</p>
                              <p className="text-sm text-red-500">Available items: {faq.items.map(item => item.id).join(', ')}</p>
                            </div>
                          );
                        }

                        return (
                          <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="text-md font-medium text-gray-800 mb-3">
                              Editing: Item {selectedFaqItem} - {selectedItem.question.substring(0, 50)}...
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Question
                                </label>
                                <input
                                  type="text"
                                  value={selectedItem.question}
                                  onChange={(e) => setFaq(prev => ({
                                    ...prev,
                                    items: prev.items.map(i =>
                                      i.id === selectedFaqItem ? { ...i, question: e.target.value } : i
                                    )
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                                  placeholder="FAQ question"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Answer
                                </label>
                                <textarea
                                  value={selectedItem.answer}
                                  onChange={(e) => setFaq(prev => ({
                                    ...prev,
                                    items: prev.items.map(i =>
                                      i.id === selectedFaqItem ? { ...i, answer: e.target.value } : i
                                    )
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                                  rows={4}
                                  placeholder="FAQ answer"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Trip Highlights Section */}
      {
        isSectionVisible('trip highlights') && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-teal-600 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">8. Trip Highlights</h2>
                    <p className="text-xs text-gray-500">Carousel of destination highlights</p>
                  </div>
                </div>
                <button
                  onClick={() => saveSection('Trip Highlights', { tripHighlights })}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-800 hover:bg-slate-700 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
                  <input
                    type="text"
                    value={tripHighlights.heading}
                    onChange={(e) => setTripHighlights(prev => ({ ...prev, heading: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-black"
                    placeholder="Discover Hidden Gems"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subheading</label>
                  <input
                    type="text"
                    value={tripHighlights.subheading}
                    onChange={(e) => setTripHighlights(prev => ({ ...prev, subheading: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-black"
                    placeholder="Experience the most breathtaking destinations"
                  />
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">Highlights Images</label>
                    <button
                      onClick={() => {
                        const newHighlight = {
                          id: Date.now().toString(),
                          src: '/highlights/1.png',
                          alt: 'New Highlight'
                        }
                        setTripHighlights(prev => ({
                          ...prev,
                          highlights: [...prev.highlights, newHighlight]
                        }))
                        setSelectedHighlight(newHighlight.id)
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      + Add Highlight
                    </button>
                  </div>

                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {tripHighlights.highlights.map((highlight, index) => (
                      <button
                        key={highlight.id}
                        onClick={() => setSelectedHighlight(highlight.id)}
                        className={`flex-shrink-0 relative w-16 h-16 rounded-lg overflow-hidden border-2 ${selectedHighlight === highlight.id ? 'border-blue-500' : 'border-transparent'}`}
                      >
                        <Image
                          src={highlight.src}
                          alt={highlight.alt}
                          fill
                          className="object-cover"
                          unoptimized={true}
                        />
                      </button>
                    ))}
                  </div>

                  {selectedHighlight && tripHighlights.highlights.find(h => h.id === selectedHighlight) && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {(() => {
                        const highlight = tripHighlights.highlights.find(h => h.id === selectedHighlight)!
                        const index = tripHighlights.highlights.findIndex(h => h.id === selectedHighlight)
                        return (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-semibold text-gray-800">Highlight {index + 1}</h4>
                              <button
                                onClick={() => {
                                  setTripHighlights(prev => ({
                                    ...prev,
                                    highlights: prev.highlights.filter(h => h.id !== selectedHighlight)
                                  }))
                                  setSelectedHighlight('')
                                }}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Select Image</label>
                              <div className="flex items-center gap-4">
                                <div className="relative w-20 h-20 rounded-md border border-gray-300 overflow-hidden bg-white">
                                  <Image
                                    src={highlight.src}
                                    alt={highlight.alt}
                                    fill
                                    className="object-cover"
                                    unoptimized={true}
                                  />
                                </div>
                                <div className="flex-1">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        if (file.size > 50 * 1024 * 1024) {
                                          alert('File size too large (max 50MB)')
                                          return
                                        }
                                        await handleImageUpload(file, (url) => {
                                          setTripHighlights(prev => ({
                                            ...prev,
                                            highlights: prev.highlights.map(h =>
                                              h.id === highlight.id ? { ...h, src: url } : h
                                            )
                                          }))
                                        })
                                      }
                                    }}
                                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 bg-white text-black"
                                  />
                                  <p className="text-xs text-gray-400 mt-1">Supported formats: JPG, PNG, WebP (Max 4MB)</p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Alt Text / Caption</label>
                              <input
                                type="text"
                                value={highlight.alt}
                                onChange={(e) => setTripHighlights(prev => ({
                                  ...prev,
                                  highlights: prev.highlights.map(h =>
                                    h.id === highlight.id ? { ...h, alt: e.target.value } : h
                                  )
                                }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white text-black"
                                placeholder="Image description"
                              />
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Group CTA Section */}
      {
        isSectionVisible('group cta') && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">9. Group CTA</h2>
                    <p className="text-xs text-gray-500">Group booking call-to-action</p>
                  </div>
                </div>
                <button
                  onClick={() => saveSection('Group CTA', { groupCta })}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-800 hover:bg-slate-700 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
                  <input
                    type="text"
                    value={groupCta.heading}
                    onChange={(e) => setGroupCta(prev => ({ ...prev, heading: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtext</label>
                  <textarea
                    value={groupCta.subtext}
                    onChange={(e) => setGroupCta(prev => ({ ...prev, subtext: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-black"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button Label</label>
                  <input
                    type="text"
                    value={groupCta.buttonLabel}
                    onChange={(e) => setGroupCta(prev => ({ ...prev, buttonLabel: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
                  <div className="flex items-center gap-4">
                    {groupCta.backgroundImageUrl && (
                      <div className="relative w-32 h-20 rounded-md border border-gray-300 overflow-hidden bg-gray-50">
                        <Image
                          src={groupCta.backgroundImageUrl}
                          alt="Group CTA Background"
                          fill
                          className="object-cover"
                          unoptimized={true}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            if (file.size > 4 * 1024 * 1024) {
                              alert('File size too large (max 4MB)')
                              return
                            }
                            await handleImageUpload(file, (url) => {
                              setGroupCta(prev => ({ ...prev, backgroundImageUrl: url }))
                            })
                          }
                        }}
                        className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 bg-white text-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

    {/* Footer Locations Section */}
    <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">10. Footer Locations</h2>
          <p className="text-xs text-gray-500">Manage Indian & International trip cards in footer</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setFooterLocations(p => ({ ...p, enabled: !p.enabled }))} className={`relative w-12 h-7 rounded-full transition-colors ${footerLocations.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${footerLocations.enabled ? 'left-6' : 'left-1'}`} />
          </button>
          <button onClick={() => saveSection('FooterLocations', { footerLocations })} disabled={saving} className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
      <div className="p-4 space-y-6">
        {/* Indian Trips */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Indian Trips</h3>
            <button onClick={() => setFooterLocations(p => ({ ...p, indian: [...p.indian, { name: '', image: '', enabled: true }] }))} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-medium">+ Add</button>
          </div>
          <div className="space-y-2">
            {footerLocations.indian.map((loc, i) => (
              <div key={i} className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg">
                <button onClick={() => { const u = [...footerLocations.indian]; u[i].enabled = !u[i].enabled; setFooterLocations(p => ({ ...p, indian: u })); }} className={`w-8 h-5 rounded-full shrink-0 ${loc.enabled ? 'bg-green-500' : 'bg-gray-300'}`}><span className={`block w-3.5 h-3.5 rounded-full bg-white shadow mx-0.5 transition-transform ${loc.enabled ? 'translate-x-3' : ''}`} /></button>
                <input type="text" value={loc.name} onChange={e => { const u = [...footerLocations.indian]; u[i].name = e.target.value; setFooterLocations(p => ({ ...p, indian: u })); }} className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black" placeholder="Location name" />
                <input type="text" value={loc.image} onChange={e => { const u = [...footerLocations.indian]; u[i].image = e.target.value; setFooterLocations(p => ({ ...p, indian: u })); }} className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black" placeholder="Image URL" />
                <label className="shrink-0 px-2 py-1.5 text-xs bg-blue-50 text-blue-600 rounded cursor-pointer hover:bg-blue-100 font-medium">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const fd = new FormData(); fd.append('file', file); fd.append('folder', 'footer'); try { const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://travelogerapi.travloger.in'}/api/upload`, { method: 'POST', body: fd }); const data = await res.json(); if (data.url) { const u = [...footerLocations.indian]; u[i].image = data.url; setFooterLocations(p => ({ ...p, indian: u })); } } catch {} }} />
                </label>
                <button onClick={() => setFooterLocations(p => ({ ...p, indian: p.indian.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600 text-xs px-2">✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* International Trips */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">International Trips</h3>
            <button onClick={() => setFooterLocations(p => ({ ...p, international: [...p.international, { name: '', image: '', enabled: true }] }))} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-medium">+ Add</button>
          </div>
          <div className="space-y-2">
            {footerLocations.international.map((loc, i) => (
              <div key={i} className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg">
                <button onClick={() => { const u = [...footerLocations.international]; u[i].enabled = !u[i].enabled; setFooterLocations(p => ({ ...p, international: u })); }} className={`w-8 h-5 rounded-full shrink-0 ${loc.enabled ? 'bg-green-500' : 'bg-gray-300'}`}><span className={`block w-3.5 h-3.5 rounded-full bg-white shadow mx-0.5 transition-transform ${loc.enabled ? 'translate-x-3' : ''}`} /></button>
                <input type="text" value={loc.name} onChange={e => { const u = [...footerLocations.international]; u[i].name = e.target.value; setFooterLocations(p => ({ ...p, international: u })); }} className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black" placeholder="Location name" />
                <input type="text" value={loc.image} onChange={e => { const u = [...footerLocations.international]; u[i].image = e.target.value; setFooterLocations(p => ({ ...p, international: u })); }} className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black" placeholder="Image URL" />
                <label className="shrink-0 px-2 py-1.5 text-xs bg-blue-50 text-blue-600 rounded cursor-pointer hover:bg-blue-100 font-medium">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const fd = new FormData(); fd.append('file', file); fd.append('folder', 'footer'); try { const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://travelogerapi.travloger.in'}/api/upload`, { method: 'POST', body: fd }); const data = await res.json(); if (data.url) { const u = [...footerLocations.international]; u[i].image = data.url; setFooterLocations(p => ({ ...p, international: u })); } } catch {} }} />
                </label>
                <button onClick={() => setFooterLocations(p => ({ ...p, international: p.international.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600 text-xs px-2">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Footer Links Section */}
    <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">11. Footer Links</h2>
          <p className="text-xs text-gray-500">Edit footer section links (About, Collab, Specials, etc.)</p>
        </div>
        <button onClick={() => saveSection('FooterLinks', { footerLinks: contact })} disabled={saving} className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-xs text-gray-500">Contact details and social links are editable in the Header section above. Footer link sections (About Travloger, Collab With Us, Specials, Creators, Gift a Trip) are managed here:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
            <input type="text" value={contact.phone} onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white" placeholder="+91-62813-92007" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="text" value={contact.email} onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white" placeholder="hello@travloger.in" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
            <input type="text" value={contact.address} onChange={(e) => setContact(prev => ({ ...prev, address: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white" placeholder="ABC road, Hyderabad, Telangana" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Number</label>
            <input type="text" value={contact.whatsapp || ''} onChange={(e) => setContact(prev => ({ ...prev, whatsapp: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white" placeholder="+919876543210" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Twitter URL</label>
            <input type="url" value={contact.twitterUrl || ''} onChange={(e) => setContact(prev => ({ ...prev, twitterUrl: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white" placeholder="https://twitter.com/travloger" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Facebook URL</label>
            <input type="url" value={contact.facebookUrl || ''} onChange={(e) => setContact(prev => ({ ...prev, facebookUrl: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white" placeholder="https://facebook.com/travloger" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram URL</label>
            <input type="url" value={contact.instagramUrl || ''} onChange={(e) => setContact(prev => ({ ...prev, instagramUrl: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white" placeholder="https://instagram.com/travloger" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">YouTube URL</label>
            <input type="url" value={contact.youtubeUrl || ''} onChange={(e) => setContact(prev => ({ ...prev, youtubeUrl: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black bg-white" placeholder="https://youtube.com/@travloger" />
          </div>
        </div>
      </div>
    </div>
    </div >
  )
}

export default WebsiteEdit
