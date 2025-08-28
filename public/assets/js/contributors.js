const contributors = [
        {
          name: 'Siputzx',
          role: 'Owner',
          image: '',
          bio: 'Pembuat, pemasar, dan CEO yang mengelola pengembangan API agar dikenal dan digunakan banyak orang.',
          skills: ['Marketing', 'Leadership'],
        },
        {
          name: 'Refly Mukudori',
          role: 'Contributor',
          image: '',
          bio: 'Mengelola dan mengembangkan solusi untuk Cloudflare dan mitigasi DDoS.',
          skills: ['Cloudflare', 'DDoS Mitigation', 'Networking', 'Security'],
        },
        {
          name: 'Yanzdev',
          role: 'Contributor',
          image: '',
          bio: 'Menyumbang beberapa scraper untuk mendukung pengembangan API.',
          skills: ['Web Scraping', 'JavaScript', 'Automation'],
        },
        {
          name: 'Daffa',
          role: 'Contributor',
          image: '',
          bio: 'Menyumbang beberapa scraper untuk mendukung pengembangan API.',
          skills: ['Web Scraping', 'Node.js'],
        },
        {
          name: 'Hann',
          role: 'Contributor',
          image: '',
          bio: 'Menyumbang beberapa scraper untuk mendukung pengembangan API.',
          skills: ['Web Scraping', 'Data Parsing'],
        },
        {
          name: 'Shannz',
          role: 'Contributor',
          image: '',
          bio: 'Menyumbang beberapa scraper untuk mendukung pengembangan API.',
          skills: ['Web Scraping', 'HTML Parsing'],
        },
        {
          name: 'Rifza',
          role: 'Contributor',
          image: '',
          bio: 'Menyumbang beberapa scraper untuk mendukung pengembangan API.',
          skills: ['JavaScript', 'Web Scraping'],
        },
        {
          name: 'Malik',
          role: 'Contributor',
          image: '',
          bio: 'Menyumbang beberapa scraper untuk mendukung pengembangan API.',
          skills: ['JavaScript', 'Web Scraping'],
        },
        {
          name: 'SSA Team',
          role: 'Contributor',
          image: '',
          bio: 'Menyumbang beberapa scraper untuk mendukung pengembangan API.',
          skills: ['Team Collaboration', 'Web Scraping'],
        },
        {
          name: 'Kavian',
          role: 'Contributor',
          image: '',
          bio: 'Menyumbang beberapa scraper untuk mendukung pengembangan API.',
          skills: ['Web Scraping', 'Data Processing'],
        },
        {
          name: 'Axell',
          role: 'Contributor',
          image: '',
          bio: 'Menyumbang beberapa scraper untuk mendukung pengembangan API.',
          skills: ['Web Scraping'],
        },
        {
          name: 'Selxyz',
          role: 'Contributor',
          image: '',
          bio: 'Menyumbang beberapa scraper untuk mendukung pengembangan API.',
          skills: ['Web Scraping'],
        },
      ]

      function getInitials(name) {
        return name
          .split(' ')
          .map((word) => word[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      }

      function createContributorCard(contributor, index) {
        const hasImage = contributor.image && contributor.image.length > 0
        const initials = getInitials(contributor.name)

        return `
                <div class="glass-card rounded-xl animate-fade" 
                     style="animation-delay: ${index * 100}ms">
                    <div class="p-6">
                        <div class="flex flex-col items-center text-center">
                            <div class="profile-container mb-4">
                                ${
                                  hasImage
                                    ? `<img src="${contributor.image}" 
                                          alt="${contributor.name}" 
                                          class="profile-image">`
                                    : `<div class="profile-initials">${initials}</div>`
                                }
                            </div>
                            
                            <h3 class="text-xl font-semibold text-white mb-1">${contributor.name}</h3>
                            <p class="text-sm text-indigo-400 mb-3 tracking-wide">${contributor.role}</p>
                            <p class="text-gray-400 text-sm mb-4 leading-relaxed">${contributor.bio}</p>
                            
                            <div class="flex flex-wrap justify-center gap-2">
                                ${contributor.skills
                                  .map(
                                    (skill) => `
                                    <span class="skill-tag text-xs px-3 py-1 rounded-full">
                                        ${skill}
                                    </span>
                                `
                                  )
                                  .join('')}
                            </div>                        
                        </div>
                    </div>
                </div>
            `
      }

      document.getElementById('contributors-grid').innerHTML = contributors
        .map((contributor, index) => createContributorCard(contributor, index))
        .join('')