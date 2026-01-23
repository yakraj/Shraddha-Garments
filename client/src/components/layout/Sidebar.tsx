import { Fragment } from "react";
import { NavLink } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  CogIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  ChartBarIcon,
  BellIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  ScissorsIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: HomeIcon },
  { name: "Employees", href: "/employees", icon: UsersIcon },
  { name: "Attendance", href: "/attendance", icon: CalendarDaysIcon },
  { name: "Machines", href: "/machines", icon: WrenchScrewdriverIcon },
  { name: "Materials", href: "/materials", icon: CubeIcon },
  { name: "Fabrics", href: "/fabrics", icon: SwatchIcon },
  { name: "Customers", href: "/customers", icon: UserGroupIcon },
  { name: "Measurements", href: "/measurements", icon: ScissorsIcon },
  { name: "Invoices", href: "/invoices", icon: DocumentTextIcon },
  { name: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCartIcon },
  { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
  { name: "Notifications", href: "/notifications", icon: BellIcon },
  { name: "Settings", href: "/settings", icon: CogIcon },
];

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>

                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>
    </>
  );
}

function SidebarContent() {
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700">
          <span className="text-lg font-bold text-white">SG</span>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Shraddha</h1>
          <p className="text-xs text-gray-500">Garments</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "sidebar-item",
                    isActive ? "sidebar-item-active" : "sidebar-item-inactive",
                  )
                }
                end={item.href === "/"}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
