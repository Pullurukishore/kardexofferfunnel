"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { MapPin, ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function AddZonePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Zone name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Zone name must be at least 2 characters";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Zone name must not exceed 50 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must not exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.createZone({
        name: formData.name.trim(),
        description: formData.description.trim() || null
      });

      if (response.success) {
        toast.success("Zone created successfully!");
        setTimeout(() => {
          router.push("/admin/zones");
        }, 1000);
      } else {
        toast.error(response.message || "Failed to create zone");
      }
    } catch (error: any) {
      console.error("Error creating zone:", error);
      toast.error(error.response?.data?.message || "Failed to create zone");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header with Back Button */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="hover:bg-slate-100 -ml-2"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Add New Zone</h1>
            <p className="text-sm text-slate-600">Create a new service zone for your organization</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Zone Information</CardTitle>
                    <CardDescription className="mt-1">Enter the details for the new service zone</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Zone Name Field */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="name" className="text-sm font-semibold text-slate-900">
                        Zone Name <span className="text-red-500">*</span>
                      </Label>
                      <span className="text-xs text-slate-500 font-medium">
                        {formData.name.length}/50
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., North Zone, South Zone"
                        className={`h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-base ${
                          errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                        }`}
                      />
                      {formData.name && !errors.name && (
                        <CheckCircle className="absolute right-4 top-3.5 h-5 w-5 text-green-500" />
                      )}
                      {errors.name && (
                        <AlertCircle className="absolute right-4 top-3.5 h-5 w-5 text-red-500" />
                      )}
                    </div>
                    {errors.name && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Description Field */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description" className="text-sm font-semibold text-slate-900">
                        Description <span className="text-slate-400 font-normal">(Optional)</span>
                      </Label>
                      <span className="text-xs text-slate-500 font-medium">
                        {formData.description.length}/500
                      </span>
                    </div>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Add a description for this zone (e.g., coverage area, key cities, etc.)"
                      className={`min-h-[140px] border-slate-200 focus:border-blue-500 focus:ring-blue-500 resize-none text-base ${
                        errors.description ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      }`}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="flex-1 h-11 font-medium"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 font-medium"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 mr-2" />
                          Create Zone
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Info Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Zone Details Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <CardHeader>
                <CardTitle className="text-base text-blue-900">Zone Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                    <p className="text-sm text-blue-800">Zone will be created as <span className="font-semibold">Active</span></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                    <p className="text-sm text-blue-800">Assign users to this zone after creation</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                    <p className="text-sm text-blue-800">Zone names must be <span className="font-semibold">unique</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Practices Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
              <CardHeader>
                <CardTitle className="text-base text-emerald-900">Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-600 font-bold text-lg leading-none mt-0.5">✓</span>
                    <p className="text-sm text-emerald-800">Use clear, descriptive names</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-600 font-bold text-lg leading-none mt-0.5">✓</span>
                    <p className="text-sm text-emerald-800">Include geographic information</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-600 font-bold text-lg leading-none mt-0.5">✓</span>
                    <p className="text-sm text-emerald-800">Edit zone details anytime</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
              <CardHeader>
                <CardTitle className="text-base text-amber-900">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-800">
                  💡 Example: <span className="font-semibold">North Zone</span> covering Delhi, Punjab, Himachal Pradesh
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
