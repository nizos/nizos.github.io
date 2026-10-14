import fs from 'node:fs'

const site = JSON.parse(fs.readFileSync(new URL('./site.json', import.meta.url), 'utf8'))

export default {
  '@type': 'Person',
  name: site.authorFullName,
  url: `${site.url}/about/`,
  jobTitle: 'Software engineer',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'SE',
  },
  sameAs: [
    'https://github.com/nizos',
    'https://www.linkedin.com/in/nizars',
  ],
  knowsAbout: [
    'Test-driven development',
    'Software architecture',
    'Developer experience',
    'Continuous integration',
    'Infrastructure as code',
    'Automation',
    'Web performance',
    'Web accessibility',
    'Software security',
    'Agentic development workflows',
    'Retrieval-augmented generation',
    'TypeScript',
    'Angular',
    'React',
    'Node.js',
    'Kotlin',
    'C#/.NET',
    'Python',
    'SQL',
    'Docker',
  ],
}
