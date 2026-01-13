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
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
    <div className="min-h-screen bg-brand-white py-12 px-4 sm:px-6 lg:px-4 md:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center">
          <img
            src="/images/logo/primary-logo-1.png"
            alt="EMDEE VENTURES"
            className="
            w-full
            max-w-[180px]
            sm:max-w-[200px]
            md:max-w-[220px]
            lg:max-w-[240px]
            object-contain
          "
          />
        </div>


        {/* Form Card */}
        <div className="rounded-xl bg-white shadow-lg border-2 border-brand-blue/20">
          <div className="border-b border-brand-grey/20 px-6 py-5">
            <h2 className="font-optima text-xl font-semibold text-brand-blue">Get Started</h2>
            <p className="font-georgia text-comments text-brand-grey mt-1">Tell us about yourself and we&apos;ll get in touch</p>
          </div>
          <div className="px-6 py-6">
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-comments font-optima font-medium text-brand-blue">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    {...form.register('firstName')}
                    placeholder="John"
                    disabled={isSubmitting}
                    className="mt-2 block w-full rounded-lg border-2 border-brand-grey/30 px-4 py-2.5 font-georgia text-comments text-brand-blue placeholder-brand-grey/50 shadow-sm transition-all focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 hover:border-brand-grey/50"
                  />
                  {form.formState.errors.firstName && (
                    <p className="mt-1.5 text-xs font-georgia text-red-600">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-comments font-optima font-medium text-brand-blue">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    {...form.register('lastName')}
                    placeholder="Doe"
                    disabled={isSubmitting}
                    className="mt-2 block w-full rounded-lg border-2 border-brand-grey/30 px-4 py-2.5 font-georgia text-comments text-brand-blue placeholder-brand-grey/50 shadow-sm transition-all focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 hover:border-brand-grey/50"
                  />
                  {form.formState.errors.lastName && (
                    <p className="mt-1.5 text-xs font-georgia text-red-600">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-comments font-optima font-medium text-brand-blue">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="john@example.com"
                  disabled={isSubmitting}
                  className="mt-2 block w-full rounded-lg border-2 border-brand-grey/30 px-4 py-2.5 font-georgia text-comments text-brand-blue placeholder-brand-grey/50 shadow-sm transition-all focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 hover:border-brand-grey/50"
                />
                {form.formState.errors.email && (
                  <p className="mt-1.5 text-xs font-georgia text-red-600">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-comments font-optima font-medium text-brand-blue">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  id="phoneNumber"
                  name="phoneNumber"
                  value={form.watch('phoneNumber')}
                  onChange={(value) => form.setValue('phoneNumber', value || '', { shouldValidate: true })}
                  defaultCountry="AE"
                  international
                  withCountryCallingCode
                  disabled={isSubmitting}
                  smartCaret={true}
                  limitMaxLength={true}
                  className="mt-2 font-nums"
                  placeholder="Enter phone number"
                  error={form.watch('phoneNumber') ? (isPossiblePhoneNumber(form.watch('phoneNumber')) ? undefined : 'Invalid phone number') : 'Phone number required'}
                />
                {form.formState.errors.phoneNumber && (
                  <p className="mt-1.5 text-xs font-georgia text-red-600">
                    {form.formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>

              {/* Lead Source */}
              <div>
                <label htmlFor="leadSource" className="block text-comments font-optima font-medium text-brand-blue">
                  How did you hear about us? <span className="text-red-500">*</span>
                </label>
                <Select
                  disabled={isSubmitting}
                  onValueChange={(value) =>
                    form.setValue('leadSource', value as LeadSource, {
                      shouldValidate: true,
                    })
                  }
                  value={form.watch('leadSource')}
                >
                  <SelectTrigger className="mt-2 h-auto rounded-lg border-2 border-brand-grey/30 px-4 py-2.5 font-georgia text-comments text-brand-blue shadow-sm transition-all focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 hover:border-brand-grey/50">
                    <SelectValue placeholder="Select a source" className="font-georgia text-brand-grey/50" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-2 border-brand-blue/20 bg-white shadow-lg">
                    {leadSourceOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="font-georgia text-comments text-brand-blue hover:bg-brand-blue focus:bg-brand-blue"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.leadSource && (
                  <p className="mt-1.5 text-xs font-georgia text-red-600">
                    {form.formState.errors.leadSource.message}
                  </p>
                )}
              </div>

              {/* RM Reference (Optional) */}
              <div>
                <label htmlFor="rmReference" className="block text-comments font-optima font-medium text-brand-blue">
                  RM Reference <span className="text-brand-grey">(Optional)</span>
                </label>
                <input
                  id="rmReference"
                  type="text"
                  {...form.register('rmReference')}
                  placeholder="Enter RM name or code if you have one"
                  disabled={isSubmitting}
                  className="mt-2 block w-full rounded-lg border-2 border-brand-grey/30 px-4 py-2.5 font-georgia text-comments text-brand-blue placeholder-brand-grey/50 shadow-sm transition-all focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 hover:border-brand-grey/50"
                />
                {form.formState.errors.rmReference && (
                  <p className="mt-1.5 text-xs font-georgia text-red-600">
                    {form.formState.errors.rmReference.message}
                  </p>
                )}
                <p className="mt-1.5 text-xs font-georgia text-brand-grey">
                  If you were referred by or already know a Relationship Manager, enter their name or code here
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-brand-blue px-6 py-2.5 font-optima text-comments font-semibold text-brand-white shadow-lg transition-all duration-200 ease-in-out hover:bg-opacity-90 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg sm:w-auto"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
