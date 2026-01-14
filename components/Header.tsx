'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CommandDialogModal from './SearchModal';
// import { CommandDialogModal } from './SearchModal';
// import SearchTrigger from './SearchTrigger';

const Header = () => {
	const pathName = usePathname();
	// const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<header>
			<div className="main-container inner">
				<Link href={'/'}>
					<Image
						src={'/logo.svg'}
						alt="COINPULSE Logo"
						width={132}
						height={40}
					/>
				</Link>

				<nav>
					<Link
						href={'/'}
						className={cn('nav-link', {
							'is-active':
								pathName ===
								'/',
							'is-home': true
						})}
					>
						Home
					</Link>

					<div>
            <CommandDialogModal />
						{/* The Search UI */}
						{/* <SearchTrigger
							onClick={() =>
								setIsModalOpen(
									true
								)
							}
						/> */}

						{/* The Modal (Logic handles Ctrl+K inside) */}
						{/* <CommandModal
							isOpen={isModalOpen}
							setIsOpen={
								setIsModalOpen
							}
						/> */}
					</div>

					<Link
						href={'/coins'}
						className={cn('nav-link', {
							'is-active':
								pathName ===
								'/coins'
						})}
					>
						All Coins
					</Link>
				</nav>
			</div>
		</header>
	);
};

export default Header;
