import { useEffect, useState, useMemo } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import SearchFilter from '@/components/filters/SearchFilter';
import { ArrowUp, ArrowDown, ArrowUpDown, Calendar as CalendarIcon } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

type SortColumn = 'created_at' | 'user' | 'workspace' | 'action' | 'model' | 'tokens_used' | 'cost';
type SortDirection = 'asc' | 'desc' | null;
type DateRangePreset = 'all' | '7days' | '30days' | 'custom';

const AdminUsage = () => {
  const { getUsageLogs } = useAdmin();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    const data = await getUsageLogs(200);
    setLogs(data);
    setIsLoading(false);
  };

  const uniqueActions = [...new Set(logs.map((log) => log.action))];

  const handleDateRangePreset = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
    const now = new Date();
    
    switch (preset) {
      case '7days':
        setStartDate(startOfDay(subDays(now, 7)));
        setEndDate(endOfDay(now));
        break;
      case '30days':
        setStartDate(startOfDay(subDays(now, 30)));
        setEndDate(endOfDay(now));
        break;
      case 'all':
        setStartDate(undefined);
        setEndDate(undefined);
        break;
      case 'custom':
        if (!startDate) setStartDate(startOfDay(subDays(now, 7)));
        if (!endDate) setEndDate(endOfDay(now));
        break;
    }
  };

  const processedLogs = useMemo(() => {
    let result = [...logs];

    if (startDate || endDate) {
      result = result.filter((log) => {
        const logDate = new Date(log.created_at);
        if (startDate && logDate < startDate) return false;
        if (endDate && logDate > endDate) return false;
        return true;
      });
    }

    if (actionFilter !== 'all') {
      result = result.filter((log) => log.action === actionFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.profiles?.first_name?.toLowerCase().includes(query) ||
          log.profiles?.last_name?.toLowerCase().includes(query) ||
          log.profiles?.email?.toLowerCase().includes(query) ||
          log.workspaces?.name?.toLowerCase().includes(query) ||
          log.model?.toLowerCase().includes(query) ||
          log.action?.toLowerCase().includes(query)
      );
    }

    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sortColumn) {
          case 'created_at':
            aVal = new Date(a.created_at).getTime();
            bVal = new Date(b.created_at).getTime();
            break;
          case 'user':
            aVal = `${a.profiles?.first_name || ''} ${a.profiles?.last_name || ''}`.trim();
            bVal = `${b.profiles?.first_name || ''} ${b.profiles?.last_name || ''}`.trim();
            break;
          case 'workspace':
            aVal = a.workspaces?.name || '';
            bVal = b.workspaces?.name || '';
            break;
          case 'action':
            aVal = a.action || '';
            bVal = b.action || '';
            break;
          case 'model':
            aVal = a.model || '';
            bVal = b.model || '';
            break;
          case 'tokens_used':
            aVal = a.tokens_used || 0;
            bVal = b.tokens_used || 0;
            break;
          case 'cost':
            aVal = parseFloat(a.cost) || 0;
            bVal = parseFloat(b.cost) || 0;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [logs, startDate, endDate, actionFilter, searchQuery, sortColumn, sortDirection]);

  const totalPages = Math.ceil(processedLogs.length / pageSize);
  const paginatedLogs = processedLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, actionFilter, searchQuery, pageSize]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') {
        setSortColumn('created_at');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    if (sortDirection === 'asc') return <ArrowUp className="ml-2 h-4 w-4" />;
    if (sortDirection === 'desc') return <ArrowDown className="ml-2 h-4 w-4" />;
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('chat')) return 'default';
    if (action.includes('image')) return 'secondary';
    if (action.includes('video')) return 'destructive';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 200 usage logs</CardDescription>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {['all', '7days', '30days', 'custom'].map((preset) => (
              <Button
                key={preset}
                variant={dateRangePreset === preset ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDateRangePreset(preset as DateRangePreset)}
              >
                {preset === 'all' ? 'All Time' : preset === '7days' ? 'Last 7 Days' : preset === '30days' ? 'Last 30 Days' : 'Custom Range'}
              </Button>
            ))}
          </div>

          {dateRangePreset === 'custom' && (
            <div className="mt-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full sm:w-[240px] justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : <span>Start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">to</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full sm:w-[240px] justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : <span>End date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
              <SearchFilter
                value={searchQuery}
                onSearchChange={setSearchQuery}
                placeholder="Search users, models, actions..."
                containerClassName="w-full sm:w-80"
              />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={pageSize.toString()} onValueChange={(val) => setPageSize(Number(val))}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="25">25 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="h-auto p-0 font-semibold hover:bg-transparent" onClick={() => handleSort('created_at')}>
                        Timestamp{getSortIcon('created_at')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="h-auto p-0 font-semibold hover:bg-transparent" onClick={() => handleSort('user')}>
                        User{getSortIcon('user')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="h-auto p-0 font-semibold hover:bg-transparent" onClick={() => handleSort('action')}>
                        Action{getSortIcon('action')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="h-auto p-0 font-semibold hover:bg-transparent" onClick={() => handleSort('model')}>
                        Model{getSortIcon('model')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="h-auto p-0 font-semibold hover:bg-transparent" onClick={() => handleSort('tokens_used')}>
                        Tokens{getSortIcon('tokens_used')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="h-auto p-0 font-semibold hover:bg-transparent" onClick={() => handleSort('cost')}>
                        Cost{getSortIcon('cost')}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No results found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{log.profiles?.first_name ? `${log.profiles.first_name} ${log.profiles.last_name || ''}`.trim() : 'N/A'}</div>
                            <div className="text-muted-foreground text-xs">{log.profiles?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.model || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-right">
                          {log.tokens_used?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          ${parseFloat(log.cost || 0).toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsage;
