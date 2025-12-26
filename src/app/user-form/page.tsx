/**
 * User Lead Form Page (Simplified)
 * Single-step form for collecting lead information with source tracking
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, Toaster } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createLeadSchema,
  type CreateLeadInput,
  type LeadSource,
} from '@/lib/validation/lead.validation';

const leadSourceOptions: { value: LeadSource; label: string }[] = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'FACEBOOK_ADS', label: 'Facebook Ads' },
  { value: 'GOOGLE_ADS', label: 'Google Ads' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'OTHER', label: 'Other' },
];

export default function UserFormPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      leadSource: undefined,
      rmReference: '',
    },
  });

  const handleSubmit = async (data: CreateLeadInput) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to submit form');
        setIsSubmitting(false);
        return;
      }

      toast.success('Thank you! Redirecting to registration...');

      // Store lead data in localStorage for registration form
      localStorage.setItem('leadFormData', JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        leadSource: data.leadSource,
        rmReference: data.rmReference,
      }));

      // Redirect to register page
      setTimeout(() => {
        router.push('/register');
      }, 1500);
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wealth Management</h1>
          <p className="mt-2 text-gray-600">
            Start your financial journey with us
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Tell us about yourself and we'll get in touch</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    {...form.register('firstName')}
                    placeholder="John"
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    {...form.register('lastName')}
                    placeholder="Doe"
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="john@example.com"
                  disabled={isSubmitting}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  {...form.register('phoneNumber')}
                  placeholder="+1 (555) 123-4567"
                  disabled={isSubmitting}
                />
                {form.formState.errors.phoneNumber && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.phoneNumber.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Include country code for international numbers
                </p>
              </div>

              {/* Lead Source */}
              <div className="space-y-2">
                <Label htmlFor="leadSource">
                  How did you hear about us? <span className="text-red-500">*</span>
                </Label>
                <Select
                  disabled={isSubmitting}
                  onValueChange={(value) =>
                    form.setValue('leadSource', value as LeadSource, {
                      shouldValidate: true,
                    })
                  }
                  value={form.watch('leadSource')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a source" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.leadSource && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.leadSource.message}
                  </p>
                )}
              </div>

              {/* RM Reference (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="rmReference">
                  RM Reference <span className="text-gray-500">(Optional)</span>
                </Label>
                <Input
                  id="rmReference"
                  {...form.register('rmReference')}
                  placeholder="Enter RM name or code if you have one"
                  disabled={isSubmitting}
                />
                {form.formState.errors.rmReference && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.rmReference.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  If you were referred by or already know a Relationship Manager, enter their name or code here
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
