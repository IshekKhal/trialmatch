import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'clinicalTrial',
  title: 'Clinical Trial',
  type: 'document',
  fields: [
    defineField({
      name: 'nctId',
      title: 'NCT ID',
      type: 'string',
      description: 'ClinicalTrials.gov unique identifier (e.g. NCT05376891)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'briefTitle',
      title: 'Brief Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'officialTitle',
      title: 'Official Scientific Title',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'phase',
      title: 'Trial Phase',
      type: 'string',
      options: {
        list: [
          {title: 'Phase 1', value: 'PHASE1'},
          {title: 'Phase 2', value: 'PHASE2'},
          {title: 'Phase 3', value: 'PHASE3'},
          {title: 'Phase 4', value: 'PHASE4'},
          {title: 'Not Applicable', value: 'NA'},
        ],
        layout: 'dropdown',
      },
    }),
    defineField({
      name: 'recruitmentStatus',
      title: 'Recruitment Status',
      type: 'string',
      options: {
        list: [
          {title: 'Recruiting', value: 'RECRUITING'},
          {title: 'Active, Not Recruiting', value: 'ACTIVE_NOT_RECRUITING'},
          {title: 'Enrolling by Invitation', value: 'ENROLLING_BY_INVITATION'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'primaryCondition',
      title: 'Primary Condition',
      type: 'string',
      description: 'Primary disease or cancer type (e.g. Non-Small Cell Lung Cancer)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'targetBiomarkers',
      title: 'Target Biomarkers',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          'EGFR',
          'KRAS',
          'BRAF',
          'HER2',
          'ALK',
          'BRCA1',
          'BRCA2',
          'ROS1',
          'MET',
          'RET',
          'NTRK',
          'FGFR',
          'G12C',
          'V600E',
          'Exon 20',
        ],
      },
    }),
    defineField({
      name: 'priorTherapyRules',
      title: 'Prior Therapy Rules',
      type: 'object',
      fields: [
        defineField({
          name: 'chemotherapy',
          title: 'Chemotherapy Rule',
          type: 'string',
          options: {
            list: [
              {title: 'Required', value: 'REQUIRED'},
              {title: 'Allowed', value: 'ALLOWED'},
              {title: 'Excluded', value: 'EXCLUDED'},
              {title: 'Any', value: 'ANY'},
            ],
            layout: 'radio',
          },
        }),
        defineField({
          name: 'immunotherapy',
          title: 'Immunotherapy Rule',
          type: 'string',
          options: {
            list: [
              {title: 'Required', value: 'REQUIRED'},
              {title: 'Allowed', value: 'ALLOWED'},
              {title: 'Excluded', value: 'EXCLUDED'},
              {title: 'Any', value: 'ANY'},
            ],
            layout: 'radio',
          },
        }),
        defineField({
          name: 'targetedTherapy',
          title: 'Targeted Therapy Rule',
          type: 'string',
          options: {
            list: [
              {title: 'Required', value: 'REQUIRED'},
              {title: 'Allowed', value: 'ALLOWED'},
              {title: 'Excluded', value: 'EXCLUDED'},
              {title: 'Any', value: 'ANY'},
            ],
            layout: 'radio',
          },
        }),
      ],
    }),
    defineField({
      name: 'locations',
      title: 'Trial Locations',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'trialLocation',
          title: 'Location',
          fields: [
            defineField({name: 'facility', title: 'Facility', type: 'string'}),
            defineField({name: 'city', title: 'City', type: 'string'}),
            defineField({name: 'state', title: 'State / Province', type: 'string'}),
            defineField({name: 'country', title: 'Country', type: 'string'}),
          ],
          preview: {
            select: {
              title: 'facility',
              city: 'city',
              state: 'state',
              country: 'country',
            },
            prepare({facility, city, state, country}) {
              const locationParts = [city, state, country].filter(Boolean).join(', ')
              return {
                title: facility || 'Unnamed Medical Facility',
                subtitle: locationParts || 'Location unspecified',
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'eligibility',
      title: 'Eligibility Criteria',
      type: 'object',
      fields: [
        defineField({
          name: 'minimumAgeYears',
          title: 'Minimum Age (Years)',
          type: 'number',
        }),
        defineField({
          name: 'maximumAgeYears',
          title: 'Maximum Age (Years)',
          type: 'number',
        }),
        defineField({
          name: 'gender',
          title: 'Eligible Gender',
          type: 'string',
          options: {
            list: [
              {title: 'All', value: 'ALL'},
              {title: 'Female', value: 'FEMALE'},
              {title: 'Male', value: 'MALE'},
            ],
            layout: 'radio',
          },
        }),
        defineField({
          name: 'inclusionSummary',
          title: 'Inclusion Criteria Summary',
          type: 'array',
          of: [{type: 'string'}],
        }),
        defineField({
          name: 'exclusionSummary',
          title: 'Exclusion Criteria Summary',
          type: 'array',
          of: [{type: 'string'}],
        }),
        defineField({
          name: 'rawCriteriaText',
          title: 'Raw Criteria Text',
          type: 'text',
          rows: 10,
        }),
      ],
    }),
    defineField({
      name: 'interventions',
      title: 'Interventions',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'trialIntervention',
          title: 'Intervention',
          fields: [
            defineField({name: 'type', title: 'Intervention Type', type: 'string'}),
            defineField({name: 'name', title: 'Intervention Name', type: 'string'}),
            defineField({name: 'description', title: 'Description', type: 'text'}),
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'type',
            },
            prepare({title, subtitle}) {
              return {
                title: title || 'Unnamed Intervention',
                subtitle: subtitle ? `Type: ${subtitle}` : undefined,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'leadSponsor',
      title: 'Lead Sponsor',
      type: 'string',
    }),
    defineField({
      name: 'sourceUrl',
      title: 'Source URL',
      type: 'url',
    }),
    defineField({
      name: 'lastUpdatedDate',
      title: 'Last Updated Date',
      type: 'date',
    }),
  ],
  preview: {
    select: {
      title: 'briefTitle',
      subtitle: 'nctId',
      condition: 'primaryCondition',
      phase: 'phase',
      status: 'recruitmentStatus',
    },
    prepare({title, subtitle, condition, phase, status}) {
      const meta = [subtitle, phase, status].filter(Boolean).join(' • ')
      return {
        title: title || 'Untitled Clinical Trial',
        subtitle: condition ? `[${condition}] ${meta}` : meta,
      }
    },
  },
})
