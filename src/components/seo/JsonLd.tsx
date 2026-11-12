import React from 'react';

export const pzoneOrganizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Pzoneinternational Engine',
  alternateName: 'شركة بي زون للمنشآت المائية وحمامات السباحة',
  url: 'https://pzoneinternational.com',
  logo: 'https://pzoneinternational.com/images/og-image.jpg',
  description: 'Pzone Water Scope Construction Projects Management (Pools, Fountains, Lagoons) in Egypt and Middle East',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+201000000000',
    contactType: 'customer service',
    areaServed: ['EG', 'AE', 'SA'],
    availableLanguage: ['Arabic', 'English'],
  },
};

export const pzoneLocalBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'GeneralContractor',
  name: 'Pzone Water Scope Construction',
  alternateName: 'شركة بي زون للمنشآت المائية',
  image: 'https://pzoneinternational.com/images/og-image.jpg',
  '@id': 'https://pzoneinternational.com/#localbusiness',
  url: 'https://pzoneinternational.com',
  telephone: '+201000000000',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Fifth Settlement',
    addressLocality: 'New Cairo',
    addressRegion: 'Cairo',
    addressCountry: 'Egypt',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 30.0074,
    longitude: 31.4284,
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
    ],
    opens: '09:00',
    closes: '17:00',
  },
  priceRange: '$$$',
  knowsAbout: [
    'Pools construction',
    'Fountains design and construction',
    'Lagoons management',
    'Water Scope Services',
  ],
};

export const pzoneProjectSchema = {
  '@context': 'https://schema.org',
  '@type': 'Project',
  name: 'Pzone Water Scope Project Management',
  description: 'Executive Water Scope Construction Projects Management (Pools, Fountains, Lagoons)',
  provider: {
    '@type': 'Organization',
    name: 'Pzoneinternational Engine',
  },
};

interface JsonLdProps {
  data?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export default function JsonLd({ data }: JsonLdProps) {
  const schemasToRender = data
    ? Array.isArray(data)
      ? data
      : [data]
    : [pzoneOrganizationSchema, pzoneLocalBusinessSchema];

  return (
    <>
      {schemasToRender.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  );
}
