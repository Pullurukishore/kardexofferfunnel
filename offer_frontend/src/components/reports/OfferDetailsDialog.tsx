'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Building2, User, MapPin, Phone, Mail, Calendar, DollarSign, FileText, Package, Settings } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { STATUS_COLORS, STAGE_COLORS, PRODUCT_TYPE_COLORS } from '@/types/reports';

interface OfferDetailsDialogProps {
  offerId: number;
  open: boolean;
  onClose: () => void;
}

interface FullOfferDetails {
  id: number;
  offerReferenceNumber: string;
  offerReferenceDate: string | null;
  title: string | null;
  description: string | null;
  productType: string | null;
  lead: string | null;
  company: string | null;
  location: string | null;
  department: string | null;
  registrationDate: string | null;
  contactPersonName: string | null;
  contactNumber: string | null;
  email: string | null;
  machineSerialNumber: string | null;
  status: string;
  stage: string;
  priority: string;
  offerValue: number | null;
  offerMonth: string | null;
  poExpectedMonth: string | null;
  probabilityPercentage: number | null;
  poNumber: string | null;
  poDate: string | null;
  poValue: number | null;
  poReceivedMonth: string | null;
  openFunnel: boolean;
  remarks: string | null;
  bookingDateInSap: string | null;
  offerEnteredInCrm: string | null;
  offerClosedInCrm: string | null;
  customer: {
    id: number;
    companyName: string;
    location: string | null;
    department: string | null;
    contacts?: Array<{
      id: number;
      contactPersonName: string;
      contactNumber: string | null;
      email: string | null;
    }>;
  };
  contact: {
    id: number;
    contactPersonName: string;
    contactNumber: string | null;
    email: string | null;
    designation: string | null;
  };
  zone: {
    id: number;
    name: string;
    shortForm: string;
  };
  assignedTo: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
  updatedBy: {
    id: number;
    name: string;
    email: string;
  };
  offerSpareParts?: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes: string | null;
    sparePart: {
      id: number;
      name: string;
      partNumber: string;
      description: string | null;
      category: string | null;
      basePrice: number;
    };
  }>;
  offerAssets?: Array<{
    id: number;
    asset: {
      id: number;
      assetName: string;
      machineSerialNumber: string | null;
      model: string | null;
      manufacturer: string | null;
      location: string | null;
      customer: {
        id: number;
        companyName: string;
      };
    };
  }>;
  stageRemarks?: Array<{
    id: number;
    stage: string;
    remarks: string;
    createdAt: string;
    createdBy: {
      id: number;
      name: string;
      email: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

const OfferDetailsDialog: React.FC<OfferDetailsDialogProps> = ({
  offerId,
  open,
  onClose,
}) => {
  const [offer, setOffer] = useState<FullOfferDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && offerId) {
      fetchOfferDetails();
    } else {
      setOffer(null);
    }
  }, [open, offerId]);

  const fetchOfferDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOfferDetails(offerId);
      if (response.success && response.data?.offer) {
        setOffer(response.data.offer);
      } else {
        toast.error('Failed to load offer details');
      }
    } catch (error: any) {
      console.error('Error fetching offer details:', error);
      toast.error(error?.response?.data?.error || 'Failed to load offer details');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const statusColor = offer ? (STATUS_COLORS[offer.status] || '#9CA3AF') : '#9CA3AF';
  const stageColor = offer ? (STAGE_COLORS[offer.stage] || '#9CA3AF') : '#9CA3AF';
  const productColor = offer?.productType 
    ? (PRODUCT_TYPE_COLORS[offer.productType] || '#9CA3AF') 
    : '#9CA3AF';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">
            Offer Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="px-6 py-4 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : offer ? (
              <>
                {/* Header Section with Stage Prominently */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-600">Offer Reference</div>
                      <div className="font-bold text-xl text-gray-900">{offer.offerReferenceNumber}</div>
                      {offer.offerReferenceDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          📅 {format(new Date(offer.offerReferenceDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                      {offer.title && (
                        <div className="text-sm text-gray-600 mt-2">{offer.title}</div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-2">Current Stage</div>
                        <Badge 
                          style={{ backgroundColor: stageColor, color: 'white' }}
                          className="text-sm px-4 py-2 font-semibold shadow-lg"
                        >
                          ⚡ {offer.stage}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer & Contact Information */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Customer & Contact Information
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Company Details */}
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-100">
                        <h4 className="font-bold text-emerald-700 mb-3 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Company Details
                        </h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-xs text-gray-500 font-semibold uppercase">Company Name</dt>
                            <dd className="text-base font-bold text-gray-900">{offer.company || offer.customer.companyName}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-gray-500 font-semibold uppercase">Location</dt>
                            <dd className="text-base font-medium text-gray-700 flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-emerald-600" />
                              {offer.location || offer.customer.location || 'N/A'}
                            </dd>
                          </div>
                          {offer.department && (
                            <div>
                              <dt className="text-xs text-gray-500 font-semibold uppercase">Department</dt>
                              <dd className="text-base font-medium text-gray-700">{offer.department}</dd>
                            </div>
                          )}
                          <div>
                            <dt className="text-xs text-gray-500 font-semibold uppercase">Zone</dt>
                            <dd className="text-base font-medium">
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 border">
                                {offer.zone?.name}
                              </Badge>
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* Contact Person */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                        <h4 className="font-bold text-blue-700 mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Contact Person
                        </h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-xs text-gray-500 font-semibold uppercase">Name</dt>
                            <dd className="text-base font-bold text-gray-900">{offer.contactPersonName || offer.contact?.contactPersonName || 'N/A'}</dd>
                          </div>
                          {(offer.contactNumber || offer.contact?.contactNumber) && (
                            <div>
                              <dt className="text-xs text-gray-500 font-semibold uppercase">Phone</dt>
                              <dd className="text-base font-medium text-gray-700 flex items-center gap-1">
                                <Phone className="h-4 w-4 text-blue-600" />
                                {offer.contactNumber || offer.contact?.contactNumber}
                              </dd>
                            </div>
                          )}
                          {(offer.email || offer.contact?.email) && (
                            <div>
                              <dt className="text-xs text-gray-500 font-semibold uppercase">Email</dt>
                              <dd className="text-base font-medium flex items-center gap-1">
                                <Mail className="h-4 w-4 text-blue-600" />
                                <a href={`mailto:${offer.email || offer.contact?.email}`} className="text-blue-600 hover:underline">
                                  {offer.email || offer.contact?.email}
                                </a>
                              </dd>
                            </div>
                          )}
                          {offer.contact?.designation && (
                            <div>
                              <dt className="text-xs text-gray-500 font-semibold uppercase">Designation</dt>
                              <dd className="text-base font-medium text-gray-700">{offer.contact.designation}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Financial Information
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-sm font-semibold text-blue-100 mb-1">Offer Value</div>
                        <div className="text-2xl font-bold">{offer.offerValue ? `₹${(offer.offerValue / 100000).toFixed(2)}L` : 'TBD'}</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-sm font-semibold text-green-100 mb-1">PO Value</div>
                        <div className="text-2xl font-bold">{offer.poValue ? `₹${(offer.poValue / 100000).toFixed(2)}L` : '-'}</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-sm font-semibold text-purple-100 mb-1">Win Probability</div>
                        <div className="text-2xl font-bold">{offer.probabilityPercentage ? `${offer.probabilityPercentage}%` : '-'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <dt className="text-xs text-gray-500 font-semibold uppercase mb-1">Offer Month</dt>
                        <dd className="text-base font-bold text-gray-900 flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          {offer.offerMonth || '-'}
                        </dd>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <dt className="text-xs text-gray-500 font-semibold uppercase mb-1">PO Expected Month</dt>
                        <dd className="text-base font-bold text-gray-900 flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-green-600" />
                          {offer.poExpectedMonth || '-'}
                        </dd>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <dt className="text-xs text-gray-500 font-semibold uppercase mb-1">PO Number</dt>
                        <dd className="text-base font-bold text-gray-900">{offer.poNumber || '-'}</dd>
                      </div>
                    </div>
                    {offer.poDate && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <dt className="text-xs text-gray-500 font-semibold uppercase mb-1">PO Date</dt>
                        <dd className="text-base font-bold text-gray-900 flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          {format(new Date(offer.poDate), 'MMM dd, yyyy')}
                        </dd>
                      </div>
                    )}
                  </div>
                </div>

                {/* Offer Details */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Offer Details
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <dt className="text-xs text-gray-500 font-semibold uppercase mb-1">Title</dt>
                        <dd className="text-base font-medium text-gray-900">{offer.title || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500 font-semibold uppercase mb-1">Product Type</dt>
                        <dd>
                          <Badge style={{ backgroundColor: productColor, color: 'white' }}>
                            {offer.productType || 'N/A'}
                          </Badge>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500 font-semibold uppercase mb-1">Lead</dt>
                        <dd className="text-base font-medium text-gray-900">{offer.lead || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500 font-semibold uppercase mb-1">Priority</dt>
                        <dd className="text-base font-medium text-gray-900">{offer.priority}</dd>
                      </div>
                    </div>
                    {offer.description && (
                      <div>
                        <dt className="text-xs text-gray-500 font-semibold uppercase mb-1">Description</dt>
                        <dd className="text-base font-medium text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">{offer.description}</dd>
                      </div>
                    )}
                    {offer.machineSerialNumber && (
                      <div>
                        <dt className="text-xs text-gray-500 font-semibold uppercase mb-1">Machine Serial Number</dt>
                        <dd className="text-base font-medium text-gray-900">{offer.machineSerialNumber}</dd>
                      </div>
                    )}
                    {offer.remarks && (
                      <div>
                        <dt className="text-xs text-gray-500 font-semibold uppercase mb-1">Remarks</dt>
                        <dd className="text-base font-medium text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">{offer.remarks}</dd>
                      </div>
                    )}
                  </div>
                </div>

                {/* Spare Parts */}
                {offer.offerSpareParts && offer.offerSpareParts.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Spare Parts ({offer.offerSpareParts.length})
                    </h3>
                    <div className="space-y-3">
                      {offer.offerSpareParts.map((part) => (
                        <div key={part.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium">{part.sparePart.name}</div>
                              <div className="text-sm text-gray-500">{part.sparePart.partNumber}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">₹{part.totalPrice.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">
                                {part.quantity} × ₹{part.unitPrice.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          {part.notes && (
                            <div className="text-sm text-gray-600 mt-2">{part.notes}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assets */}
                {offer.offerAssets && offer.offerAssets.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Assets ({offer.offerAssets.length})
                    </h3>
                    <div className="space-y-3">
                      {offer.offerAssets.map((asset) => (
                        <div key={asset.id} className="border rounded-lg p-4">
                          <div className="font-medium">{asset.asset.assetName}</div>
                          {asset.asset.machineSerialNumber && (
                            <div className="text-sm text-gray-500 mt-1">
                              Serial: {asset.asset.machineSerialNumber}
                            </div>
                          )}
                          {asset.asset.customer && (
                            <div className="text-sm text-gray-500 mt-1">
                              Customer: {asset.asset.customer.companyName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stage Remarks */}
                {offer.stageRemarks && offer.stageRemarks.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-lg mb-4">Stage Remarks</h3>
                    <div className="space-y-3">
                      {offer.stageRemarks.map((remark) => (
                        <div key={remark.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <Badge>{remark.stage}</Badge>
                            <div className="text-xs text-gray-500">
                              {format(new Date(remark.createdAt), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 mt-2">{remark.remarks}</div>
                          <div className="text-xs text-gray-500 mt-2">
                            By: {remark.createdBy.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assignment & Tracking */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-4">Assignment & Tracking</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Zone</div>
                      <div className="font-medium">{offer.zone.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Created By</div>
                      <div className="font-medium">{offer.createdBy.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Created At</div>
                      <div className="font-medium">
                        {format(new Date(offer.createdAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                {offer.remarks && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-lg mb-4">Remarks</h3>
                    <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {offer.remarks}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No offer details found
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default OfferDetailsDialog;

