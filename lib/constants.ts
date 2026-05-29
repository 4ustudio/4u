export const ACADEMY = {
  name: '4U Studio Academy',
  phone: '573170192639',
  phoneDisplay: '+57 317 019 2639',
  waMessage: 'Hola%20quiero%20más%20información%20sobre%204ustudioacademy.com',
  get waUrl() {
    return `https://api.whatsapp.com/send/?phone=${this.phone}&text=${this.waMessage}`
  },
  email: 'info@4ustudioacademy.com',
  address: 'Bogotá D.C., Colombia',
} as const
