export class PaginationResponseDto<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}
