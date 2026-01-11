'use client';
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious
} from '@/components/ui/pagination';
import { buildPageNumbers, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const CoinsPagination = ({
	currentPage,
	totalPages,
	hasMorePages
}: Pagination) => {
	const router = useRouter();

	const handlePageChange = (page: number) => {
		router.push(`/coins?page=${page}`);
	};

	const isLastPage = !hasMorePages || currentPage === totalPages;

	const pageNumbers = buildPageNumbers(currentPage, totalPages);
	return (
		<Pagination id="coins-pagination">
			<PaginationContent className="pagination-content">
				<PaginationItem className="pagination-control prev">
					<PaginationPrevious
						onClick={() =>
							currentPage > 1 &&
							handlePageChange(
								currentPage - 1
							)
						}
						className={
							currentPage === 1
								? 'control-disabled'
								: 'control-button'
						}
					/>
				</PaginationItem>

				<div className="pagination-pages">
					{pageNumbers.map((pageNum, index) => (
						<PaginationItem key={index}>
							{pageNum ===
							'ellipsis' ? (
								<PaginationEllipsis />
							) : (
								<PaginationLink
									className={cn(
										'page-link',
										{
											'page-link-active':
												currentPage ===
												pageNum
										}
									)}
									onClick={() =>
										handlePageChange(
											pageNum as number
										)
									}
								>
									{
										pageNum
									}
								</PaginationLink>
							)}
						</PaginationItem>
					))}
				</div>

				<PaginationItem className="pagination-control next">
					<PaginationNext
						onClick={() =>
							!isLastPage &&
							handlePageChange(
								currentPage + 1
							)
						}
						className={
							isLastPage
								? 'control-disabled'
								: 'control-button'
						}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
};

export default CoinsPagination;
