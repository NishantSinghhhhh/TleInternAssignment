import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Courses</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">
                  Level 1
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">
                  Level 2
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">
                  Level 3
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">
                  Level 4
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Information</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">
                  Our Mentors
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">
                  Report Bug
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Socials</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">
                  Discord
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">
                  LinkedIn
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">
                  Instagram
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">
                  Twitter
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-white">
                  YouTube
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            <span className="font-semibold">Codelift Academy Private Limited</span> | All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
