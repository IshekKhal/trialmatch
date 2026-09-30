import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'protocolRule',
  title: 'Clinical Protocol Interpretation Rule',
  type: 'document',
  fields: [
    defineField({
      name: 'ruleId',
      title: 'Rule ID',
      type: 'string',
      description: 'Unique protocol rule identifier (e.g. RULE-EXCLUSION-OVERRIDE)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Rule Title',
      type: 'string',
      description: 'Human-readable title of the protocol guidance rule',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Eligibility Hierarchy', value: 'ELIGIBILITY_HIERARCHY'},
          {title: 'Washout Periods', value: 'WASHOUT_PERIODS'},
          {title: 'Biomarker Specificity', value: 'BIOMARKER_SPECIFICITY'},
          {title: 'Geographic Validation', value: 'GEOGRAPHIC_VALIDATION'},
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'priority',
      title: 'Priority (1-10)',
      type: 'number',
      description: 'Precedence weight for AI protocol reasoning (10 = highest priority override)',
      validation: (Rule) => Rule.required().min(1).max(10),
    }),
    defineField({
      name: 'summary',
      title: 'Rule Summary',
      type: 'text',
      rows: 4,
      description: 'Plain English explanation of the rule for clinical trial matching',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'clinicalRationale',
      title: 'Clinical Rationale',
      type: 'text',
      rows: 8,
      description: 'Detailed medical, regulatory, and protocol reasoning for knowledge base indexing',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'ruleId',
      category: 'category',
      priority: 'priority',
    },
    prepare({title, subtitle, category, priority}) {
      return {
        title: title || 'Untitled Rule',
        subtitle: `[${category || 'GENERAL'}] Priority: ${priority ?? 'N/A'} • ${subtitle || ''}`,
      }
    },
  },
})
