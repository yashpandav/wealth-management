/**
 * Admin - Product Purchase Requests Table Component
 * Displays product purchase requests with filtering, sorting, and view details
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Eye,
    CheckCircle,
    Clock,
    XCircle,
    User,
    Briefcase
} from 'lucide-react';
import { DirhamIcon } from '@/components/ui/dirham-icon';

interface ProductRequest {
    id: string;
    trackingNumber: string;
    clientId: string;
    client: {
        id: string;
        user: {
            firstName: string;
            lastName: string;
            email: string;
        };
    };
    investment: {
        id: string;
        name: string;
        currency: string;
    };
    investmentOption: {
        id: string;
        duration: string;
        withdrawalFrequency: string;
        roi: number;
        annualReturn: number;
    };
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    clientNotes: string | null;
    rmNotes: string | null;
    rejectionReason: string | null;
    createdAt: string;
    processedAt: string | null;
    assignedRM: {
        user: {
            firstName: string;
            lastName: string;
        };
    } | null;
}

interface ProductRequestsResponse {
    success: boolean;
    data: {
        requests: ProductRequest[];
        summary: {
            total: number;
            totalAmount: number;
            byStatus: Array<{
                status: string;
                count: number;
                totalAmount: number;
            }>;
        };
        pagination: {
            page: number;
            limit: number;
            totalCount: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    };
    error?: string;
}

async function fetchProductRequests(params: {
    page: number;
    search: string;
    status: string;
    sortBy: string;
    sortOrder: string;
}): Promise<ProductRequestsResponse> {
    const queryParams = new URLSearchParams({
        page: params.page.toString(),
        limit: '20',
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
    });

    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);

    const response = await fetch(`/api/admin/product-requests?${queryParams.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch product requests');
    }
    return response.json();
}

export function AdminProductRequestsTable() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Detail view state
    const [detailDialog, setDetailDialog] = useState<{
        open: boolean;
        request: ProductRequest | null;
    }>({
        open: false,
        request: null,
    });

    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-product-requests', page, search, status, sortBy, sortOrder],
        queryFn: () => fetchProductRequests({ page, search, status, sortBy, sortOrder }),
    });

    // Separate query for global stats
    const { data: globalStatsData } = useQuery({
        queryKey: ['admin-product-requests-stats'],
        queryFn: () => fetchProductRequests({ page: 1, search: '', status: '', sortBy: 'createdAt', sortOrder: 'desc' }),
    });

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
            case 'APPROVED':
                return <Badge variant="outline" className="bg-green-500/10 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</Badge>;
            case 'REJECTED':
                return <Badge variant="outline" className="bg-red-500/10 text-red-700 flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
            case 'COMPLETED':
                return <Badge variant="outline" className="bg-brand-blue/10 text-brand-blue flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Failed to load product requests. Please try again later.</AlertDescription>
            </Alert>
        );
    }

    const requests = data?.data.requests || [];
    const summary = globalStatsData?.data.summary;
    const pagination = data?.data.pagination;

    return (
        <div className="space-y-4">
            {/* Summary Stats Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'].map(statKey => {
                        const stat = summary.byStatus.find(s => s.status === statKey) || { count: 0, totalAmount: 0 };
                        const colors: Record<string, string> = {
                            'PENDING': 'text-yellow-600',
                            'APPROVED': 'text-green-600',
                            'COMPLETED': 'text-brand-blue',
                            'REJECTED': 'text-red-600'
                        };
                        return (
                            <div key={statKey} className="bg-white p-4 rounded-lg border shadow-sm">
                                <p className="text-sm text-brand-grey font-medium capitalize">{statKey.toLowerCase()}</p>
                                <div className="flex items-end justify-between mt-1">
                                    <p className={`text-2xl font-bold font-nums ${colors[statKey]}`}>{stat.count}</p>
                                    <div className="flex items-center text-xs text-brand-grey mb-1 font-nums">
                                        <DirhamIcon className="w-3 h-3 text-brand-grey mr-1" />
                                        {stat.totalAmount.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
                    <div className="relative w-full sm:max-w-md flex-1">
                        <Input
                            placeholder="Search by tracking #, client, or product..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full"
                        />
                    </div>
                    <Select
                        value={status}
                        onValueChange={(value) => {
                            setStatus(value === 'all' ? '' : value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-sm text-brand-grey ml-auto whitespace-nowrap hidden md:block">
                    <span className="font-nums">{pagination?.totalCount || 0}</span> total requests
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <ResponsiveTable>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('trackingNumber')} className="h-8 px-2 font-bold">
                                        Tracking #
                                    </Button>
                                </TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Assigned RM</TableHead>
                                <TableHead className="text-right">
                                    <Button variant="ghost" onClick={() => handleSort('amount')} className="h-8 px-2 font-bold">
                                        Amount
                                    </Button>
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('createdAt')} className="h-8 px-2 font-bold">
                                        Date
                                    </Button>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : requests.length > 0 ? (
                                requests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-mono text-sm font-nums">{req.trackingNumber}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{req.client.user.firstName} {req.client.user.lastName}</p>
                                                <p className="text-xs text-muted-foreground">{req.client.user.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <Badge variant="outline" className="font-medium mb-1">{req.investment.name}</Badge>
                                                <div className="text-xs text-muted-foreground font-nums">
                                                    {req.investmentOption.duration} | {req.investmentOption.annualReturn}%
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {req.assignedRM ? (
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <Briefcase className="w-3 h-3" />
                                                    {req.assignedRM.user.firstName} {req.assignedRM.user.lastName}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            <div className="flex items-center justify-end font-nums">
                                                {req.investment.currency === 'USD' ? '$' : <DirhamIcon className="w-3 h-3 mr-1" />}
                                                {req.amount.toLocaleString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                                        <TableCell className="font-nums text-sm text-gray-600">{format(new Date(req.createdAt), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDetailDialog({ open: true, request: req })}
                                            >
                                                <Eye className="h-4 w-4 text-brand-blue" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        No product requests found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ResponsiveTable>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground font-nums">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                        {pagination.totalCount} requests
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p - 1)}
                            disabled={!pagination.hasPrevPage}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <div className="text-sm font-nums">
                            Page {pagination.page} of {pagination.totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={!pagination.hasNextPage}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={detailDialog.open} onOpenChange={(open) => {
                if (!open) setDetailDialog({ open: false, request: null });
            }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Product Request Details</DialogTitle>
                    </DialogHeader>
                    {detailDialog.request && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                                    <p className="font-mono font-nums">{detailDialog.request.trackingNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    {getStatusBadge(detailDialog.request.status)}
                                </div>
                            </div>
                            <div className="border-t border-b py-3 my-2">
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><User className="w-4 h-4" /> Client Info</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Name</p>
                                        <p className="font-medium">{detailDialog.request.client.user.firstName} {detailDialog.request.client.user.lastName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="text-sm">{detailDialog.request.client.user.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Product</p>
                                    <p className="font-medium text-brand-blue">{detailDialog.request.investment.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Amount</p>
                                    <p className="font-medium flex items-center font-nums text-lg">
                                        {detailDialog.request.investment.currency === 'USD' ? '$' : <DirhamIcon className="w-3 h-3 mr-1" />}
                                        {detailDialog.request.amount.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Options</p>
                                    <p className="text-sm">{detailDialog.request.investmentOption.duration} @ {detailDialog.request.investmentOption.withdrawalFrequency}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Return</p>
                                    <p className="text-green-600 font-medium">{detailDialog.request.investmentOption.annualReturn}% Annual</p>
                                </div>
                            </div>

                            {detailDialog.request.assignedRM && (
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <p className="text-xs text-muted-foreground mb-1">Assigned Relationship Manager</p>
                                    <div className="flex items-center gap-2 font-medium text-sm">
                                        <Briefcase className="w-4 h-4 text-brand-grey" />
                                        {detailDialog.request.assignedRM.user.firstName} {detailDialog.request.assignedRM.user.lastName}
                                    </div>
                                </div>
                            )}

                            {detailDialog.request.clientNotes && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Client Notes</p>
                                    <p className="text-sm bg-gray-50 p-2 rounded">{detailDialog.request.clientNotes}</p>
                                </div>
                            )}
                            {detailDialog.request.rmNotes && (
                                <div>
                                    <p className="text-sm text-muted-foreground">RM Notes</p>
                                    <p className="text-sm bg-gray-50 p-2 rounded">{detailDialog.request.rmNotes}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailDialog({ open: false, request: null })}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
