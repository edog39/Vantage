/**
 * taskEngine.js
 * 
 * The core "never-ending" task generation engine for Vantage.
 * Responsible for creating, spawning, and managing business tasks.
 * 
 * KEY DESIGN: Context-aware workflow chains.
 * Each task stores structured context (company, feature, module, etc.) and a
 * template key. When completed, the engine looks up contextual follow-up
 * templates that logically continue the workflow, injecting the SAME context
 * so that "Prepare proposal for Acme Corp" naturally leads to
 * "Send proposal to Acme Corp" → "Schedule onboarding call with Acme Corp".
 * 
 * Cross-category context bridges also exist — e.g., closing a sale spawns
 * a Finance invoice task for the same company.
 * 
 * Exports: TaskEngine object with methods for task lifecycle management.
 */

const TaskEngine = (() => {

  /* ══════════════════════════════════════
     Category Definitions
     ══════════════════════════════════════ */
  const CATEGORIES = [
    { id: "marketing",   label: "Marketing",   color: "#6366f1", icon: "📣" },
    { id: "sales",       label: "Sales",       color: "#f59e0b", icon: "💰" },
    { id: "operations",  label: "Operations",  color: "#10b981", icon: "⚙️" },
    { id: "hr",          label: "HR",          color: "#ec4899", icon: "👥" },
    { id: "finance",     label: "Finance",     color: "#14b8a6", icon: "📊" },
    { id: "product",     label: "Product",     color: "#8b5cf6", icon: "🚀" },
    { id: "engineering", label: "Engineering", color: "#3b82f6", icon: "🔧" },
    { id: "support",     label: "Support",     color: "#f97316", icon: "🎧" }
  ];

  /* ══════════════════════════════════════
     Priority Levels
     ══════════════════════════════════════ */
  const PRIORITIES = [
    { id: "critical", label: "Critical", weight: 4 },
    { id: "high",     label: "High",     weight: 3 },
    { id: "medium",   label: "Medium",   weight: 2 },
    { id: "low",      label: "Low",      weight: 1 }
  ];

  /* ══════════════════════════════════════
     Placeholder Fill-In Data
     Used when generating fresh context values.
     ══════════════════════════════════════ */
  const FILL_DATA = {
    company: ["Acme Corp", "Globex Inc", "Initech", "Umbrella Co", "Stark Industries",
              "Wayne Enterprises", "Hooli", "Pied Piper", "Dunder Mifflin", "Prestige Worldwide",
              "Cyberdyne Systems", "Wonka Industries", "Massive Dynamic", "Soylent Corp"],
    channel: ["Google Ads", "LinkedIn", "Instagram", "TikTok", "Twitter/X", "YouTube", "Email", "Facebook"],
    topic: ["AI in Business", "Remote Work Best Practices", "Growth Hacking", "Customer Retention",
            "Industry Trends 2026", "Data-Driven Decisions", "Sustainable Business", "Team Productivity"],
    variant: ["A", "B", "C", "D"],
    product: ["Pro Plan", "Enterprise Suite", "Starter Pack", "API Platform", "Analytics Dashboard"],
    process: ["invoicing", "onboarding", "deployment", "reporting", "approvals"],
    vendor: ["AWS", "Salesforce", "HubSpot", "Slack", "Zoom", "Notion", "Figma"],
    role: ["Software Engineer", "Product Manager", "Sales Rep", "Marketing Lead",
           "Data Analyst", "UX Designer", "DevOps Engineer", "Customer Success Manager"],
    month: ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"],
    feature: ["Dashboard", "Notifications", "Search", "Settings", "Reports",
              "Integrations", "Permissions", "Billing", "Onboarding", "Analytics"],
    module: ["auth", "payments", "notifications", "analytics", "user-management", "api-gateway"],
    severity: ["critical", "high", "medium", "low"],
    service: ["user-service", "payment-service", "notification-service", "analytics-service"],
    env: ["staging", "production", "dev"]
  };

  /* ══════════════════════════════════════════════════════════════════════════
     Workflow-Aware Task Templates
     
     Each template object has:
       - key:        Unique identifier for this template
       - template:   Title string with {placeholder} tokens
       - contextKeys: Which FILL_DATA keys this template uses (for extraction)
       - followUps:  Array of contextual follow-up definitions, each with:
           - template:  Follow-up title (uses same context)
           - category:  Which category the follow-up belongs to (enables cross-category)
           - priority:  Optional priority override ("critical"|"high"|"medium"|"low")
       - crossCategory: Optional array of cross-category follow-ups triggered by completion
     ══════════════════════════════════════════════════════════════════════════ */
  const WORKFLOW_TEMPLATES = {

    /* ── Marketing ── */
    marketing: [
      {
        key: "mkt_content_calendar",
        template: "Draft Q{q} social media content calendar",
        contextKeys: ["q"],
        followUps: [
          { template: "Review Q{q} content calendar with stakeholders", category: "marketing" },
          { template: "Get design assets for Q{q} social posts", category: "marketing" },
          { template: "Schedule Q{q} social media posts", category: "marketing" },
          { template: "Set up analytics tracking for Q{q} social campaigns", category: "marketing" }
        ]
      },
      {
        key: "mkt_campaign_roi",
        template: "Analyze campaign ROI for {channel}",
        contextKeys: ["channel"],
        followUps: [
          { template: "Present {channel} ROI findings to leadership", category: "marketing" },
          { template: "Optimize {channel} ad spend based on ROI data", category: "marketing" },
          { template: "Create follow-up campaign for {channel}", category: "marketing" },
          { template: "Update {channel} budget allocation", category: "finance", priority: "medium" }
        ]
      },
      {
        key: "mkt_ab_test",
        template: "Create A/B test for landing page {variant}",
        contextKeys: ["variant"],
        followUps: [
          { template: "Monitor A/B test results for variant {variant}", category: "marketing" },
          { template: "Analyze conversion data for variant {variant}", category: "marketing" },
          { template: "Implement winning variant from {variant} test", category: "engineering" },
          { template: "Document A/B test learnings — variant {variant}", category: "marketing" }
        ]
      },
      {
        key: "mkt_blog",
        template: "Write blog post about {topic}",
        contextKeys: ["topic"],
        followUps: [
          { template: "Edit and proofread {topic} blog post", category: "marketing" },
          { template: "Create social media snippets for {topic} article", category: "marketing" },
          { template: "Design featured image for {topic} blog post", category: "marketing" },
          { template: "Distribute {topic} blog post to newsletter subscribers", category: "marketing" },
          { template: "Track engagement metrics for {topic} blog post", category: "marketing" }
        ]
      },
      {
        key: "mkt_webinar",
        template: "Plan webinar on {topic}",
        contextKeys: ["topic"],
        followUps: [
          { template: "Create slide deck for {topic} webinar", category: "marketing" },
          { template: "Send invite emails for {topic} webinar", category: "marketing" },
          { template: "Set up registration page for {topic} webinar", category: "marketing" },
          { template: "Rehearse {topic} webinar presentation", category: "marketing" },
          { template: "Prepare follow-up sequence for {topic} webinar attendees", category: "sales" }
        ]
      },
      {
        key: "mkt_ad_creative",
        template: "Design ad creative for {channel} campaign",
        contextKeys: ["channel"],
        followUps: [
          { template: "Get approval on {channel} ad creative", category: "marketing" },
          { template: "Launch {channel} ad campaign", category: "marketing" },
          { template: "Set up conversion tracking for {channel} ads", category: "marketing" },
          { template: "Monitor first 48h performance of {channel} ads", category: "marketing" }
        ]
      },
      {
        key: "mkt_seo_audit",
        template: "Audit SEO performance for top pages",
        contextKeys: [],
        followUps: [
          { template: "Fix critical SEO issues from audit", category: "engineering" },
          { template: "Update meta descriptions for underperforming pages", category: "marketing" },
          { template: "Build backlink outreach list from SEO audit", category: "marketing" },
          { template: "Create content brief for SEO gap opportunities", category: "marketing" }
        ]
      },
      {
        key: "mkt_influencer",
        template: "Schedule influencer outreach for {channel}",
        contextKeys: ["channel"],
        followUps: [
          { template: "Negotiate rates with {channel} influencers", category: "marketing" },
          { template: "Brief influencers on {channel} campaign goals", category: "marketing" },
          { template: "Review influencer content drafts for {channel}", category: "marketing" },
          { template: "Measure influencer campaign impact on {channel}", category: "marketing" }
        ]
      },
      {
        key: "mkt_press_release",
        template: "Prepare press release for product launch",
        contextKeys: [],
        followUps: [
          { template: "Get legal review on press release", category: "operations" },
          { template: "Distribute press release to media contacts", category: "marketing" },
          { template: "Monitor press coverage and media mentions", category: "marketing" },
          { template: "Compile media coverage report for leadership", category: "marketing" }
        ]
      },
      {
        key: "mkt_competitor",
        template: "Review competitor positioning report",
        contextKeys: [],
        followUps: [
          { template: "Update competitive battle cards with new findings", category: "sales" },
          { template: "Identify messaging gaps from competitor analysis", category: "marketing" },
          { template: "Brief sales team on competitor positioning changes", category: "sales" },
          { template: "Adjust product positioning based on competitor moves", category: "product" }
        ]
      }
    ],

    /* ── Sales ── */
    sales: [
      {
        key: "sales_follow_up",
        template: "Follow up with {company} lead",
        contextKeys: ["company"],
        followUps: [
          { template: "Schedule discovery call with {company}", category: "sales" },
          { template: "Send case studies to {company} stakeholders", category: "sales" },
          { template: "Research {company} org structure for champion mapping", category: "sales" },
          { template: "Add {company} notes to CRM", category: "sales" }
        ]
      },
      {
        key: "sales_proposal",
        template: "Prepare proposal for {company}",
        contextKeys: ["company"],
        followUps: [
          { template: "Send proposal to {company} decision makers", category: "sales" },
          { template: "Schedule proposal walkthrough with {company}", category: "sales" },
          { template: "Prepare pricing alternatives for {company}", category: "sales" },
          { template: "Get legal review on {company} contract terms", category: "operations" }
        ]
      },
      {
        key: "sales_demo",
        template: "Conduct demo for {company}",
        contextKeys: ["company"],
        followUps: [
          { template: "Send demo recording and recap to {company}", category: "sales" },
          { template: "Address {company} technical questions from demo", category: "engineering" },
          { template: "Prepare custom ROI analysis for {company}", category: "sales" },
          { template: "Schedule follow-up meeting with {company}", category: "sales" }
        ]
      },
      {
        key: "sales_negotiate",
        template: "Negotiate contract terms with {company}",
        contextKeys: ["company"],
        followUps: [
          { template: "Get legal approval on {company} contract", category: "operations" },
          { template: "Process signed contract for {company}", category: "sales", priority: "high" },
          { template: "Generate initial invoice for {company}", category: "finance" },
          { template: "Schedule {company} onboarding kickoff", category: "support" },
          { template: "Notify product team about {company} requirements", category: "product" }
        ]
      },
      {
        key: "sales_pipeline",
        template: "Update CRM pipeline for Q{q}",
        contextKeys: ["q"],
        followUps: [
          { template: "Verify Q{q} pipeline accuracy with reps", category: "sales" },
          { template: "Identify at-risk deals in Q{q} pipeline", category: "sales" },
          { template: "Present Q{q} pipeline review to leadership", category: "sales" },
          { template: "Update Q{q} revenue forecast based on pipeline", category: "finance" }
        ]
      },
      {
        key: "sales_outreach",
        template: "Cold outreach batch — {num2} prospects",
        contextKeys: ["num2"],
        followUps: [
          { template: "Follow up on non-responders from {num2}-prospect batch", category: "sales" },
          { template: "Qualify responses from {num2}-prospect outreach", category: "sales" },
          { template: "A/B test subject lines for next outreach batch", category: "sales" },
          { template: "Update prospect list for next outreach batch", category: "sales" }
        ]
      },
      {
        key: "sales_churn",
        template: "Analyze churn reasons for Q{q}",
        contextKeys: ["q"],
        followUps: [
          { template: "Present Q{q} churn analysis to product team", category: "product" },
          { template: "Create win-back campaign for Q{q} churned accounts", category: "marketing" },
          { template: "Implement retention improvements based on Q{q} churn data", category: "product" },
          { template: "Update Q{q} churn report for board", category: "finance" }
        ]
      },
      {
        key: "sales_qbr",
        template: "Schedule quarterly business review with {company}",
        contextKeys: ["company"],
        followUps: [
          { template: "Prepare QBR deck for {company}", category: "sales" },
          { template: "Pull usage analytics for {company} QBR", category: "product" },
          { template: "Conduct QBR meeting with {company}", category: "sales" },
          { template: "Document action items from {company} QBR", category: "sales" },
          { template: "Identify upsell opportunities from {company} QBR", category: "sales" }
        ]
      },
      {
        key: "sales_upsell",
        template: "Create upsell playbook for {product}",
        contextKeys: ["product"],
        followUps: [
          { template: "Train sales team on {product} upsell playbook", category: "sales" },
          { template: "Create objection handling guide for {product} upsell", category: "sales" },
          { template: "Build {product} upsell email sequence", category: "marketing" },
          { template: "Track {product} upsell conversion rates", category: "sales" }
        ]
      }
    ],

    /* ── Operations ── */
    operations: [
      {
        key: "ops_vendor_audit",
        template: "Audit vendor contract with {vendor}",
        contextKeys: ["vendor"],
        followUps: [
          { template: "Negotiate renewal terms with {vendor}", category: "operations" },
          { template: "Evaluate {vendor} alternatives", category: "operations" },
          { template: "Update {vendor} SLA documentation", category: "operations" },
          { template: "Review {vendor} spending with finance", category: "finance" }
        ]
      },
      {
        key: "ops_sop",
        template: "Review and update SOP documentation",
        contextKeys: [],
        followUps: [
          { template: "Distribute updated SOPs to department leads", category: "operations" },
          { template: "Schedule SOP training sessions", category: "hr" },
          { template: "Set up quarterly SOP review cycle", category: "operations" },
          { template: "Audit compliance with updated SOPs", category: "operations" }
        ]
      },
      {
        key: "ops_tooling",
        template: "Evaluate new tooling for {process}",
        contextKeys: ["process"],
        followUps: [
          { template: "Run pilot program for new {process} tool", category: "operations" },
          { template: "Collect team feedback on {process} tool trial", category: "operations" },
          { template: "Prepare cost-benefit analysis for {process} tool", category: "finance" },
          { template: "Plan migration to new {process} tool", category: "operations" },
          { template: "Train team on new {process} tool", category: "hr" }
        ]
      },
      {
        key: "ops_vendor_renewal",
        template: "Negotiate vendor renewal for {vendor}",
        contextKeys: ["vendor"],
        followUps: [
          { template: "Finalize {vendor} renewal paperwork", category: "operations" },
          { template: "Update {vendor} contract in records", category: "operations" },
          { template: "Review {vendor} renewal impact on budget", category: "finance" },
          { template: "Communicate {vendor} changes to affected teams", category: "operations" }
        ]
      },
      {
        key: "ops_disaster_recovery",
        template: "Update disaster recovery plan",
        contextKeys: [],
        followUps: [
          { template: "Schedule disaster recovery drill", category: "operations" },
          { template: "Review backup systems and failover procedures", category: "engineering" },
          { template: "Train team leads on disaster recovery protocols", category: "hr" },
          { template: "Document lessons learned from DR drill", category: "operations" }
        ]
      },
      {
        key: "ops_efficiency",
        template: "Conduct process efficiency analysis for {process}",
        contextKeys: ["process"],
        followUps: [
          { template: "Implement efficiency improvements for {process}", category: "operations" },
          { template: "Measure impact of {process} optimizations", category: "operations" },
          { template: "Document new {process} workflow", category: "operations" },
          { template: "Train team on optimized {process} workflow", category: "hr" }
        ]
      },
      {
        key: "ops_compliance",
        template: "Review compliance requirements update",
        contextKeys: [],
        followUps: [
          { template: "Update policies to meet new compliance standards", category: "operations" },
          { template: "Schedule compliance training for all employees", category: "hr" },
          { template: "Audit current systems for compliance gaps", category: "engineering" },
          { template: "Report compliance status to leadership", category: "operations" }
        ]
      }
    ],

    /* ── HR ── */
    hr: [
      {
        key: "hr_screen",
        template: "Screen candidates for {role} position",
        contextKeys: ["role"],
        followUps: [
          { template: "Schedule first-round interviews for {role}", category: "hr" },
          { template: "Prepare interview scorecard for {role} candidates", category: "hr" },
          { template: "Coordinate technical assessment for {role} candidates", category: "hr" },
          { template: "Send rejection emails for unqualified {role} candidates", category: "hr" }
        ]
      },
      {
        key: "hr_interview",
        template: "Schedule interviews — {role} role",
        contextKeys: ["role"],
        followUps: [
          { template: "Conduct interviews for {role} position", category: "hr" },
          { template: "Collect interviewer feedback for {role} candidates", category: "hr" },
          { template: "Schedule final-round interviews for {role}", category: "hr" },
          { template: "Prepare {role} offer package", category: "hr", priority: "high" }
        ]
      },
      {
        key: "hr_job_desc",
        template: "Draft job description for {role}",
        contextKeys: ["role"],
        followUps: [
          { template: "Get hiring manager approval on {role} job description", category: "hr" },
          { template: "Post {role} job to job boards", category: "hr" },
          { template: "Share {role} opening on social channels", category: "marketing" },
          { template: "Set up applicant tracking for {role}", category: "hr" }
        ]
      },
      {
        key: "hr_team_building",
        template: "Plan team-building event for Q{q}",
        contextKeys: ["q"],
        followUps: [
          { template: "Book venue for Q{q} team-building event", category: "hr" },
          { template: "Send invitations for Q{q} team event", category: "hr" },
          { template: "Coordinate catering for Q{q} team event", category: "operations" },
          { template: "Collect feedback from Q{q} team-building event", category: "hr" }
        ]
      },
      {
        key: "hr_perf_review",
        template: "Conduct performance review cycle prep",
        contextKeys: [],
        followUps: [
          { template: "Distribute self-evaluation forms", category: "hr" },
          { template: "Train managers on review process", category: "hr" },
          { template: "Compile performance data for reviews", category: "hr" },
          { template: "Schedule 1-on-1 review meetings", category: "hr" },
          { template: "Prepare compensation adjustment recommendations", category: "finance" }
        ]
      },
      {
        key: "hr_orientation",
        template: "Coordinate new hire orientation",
        contextKeys: [],
        followUps: [
          { template: "Set up new hire workstations and accounts", category: "operations" },
          { template: "Schedule new hire meet-and-greets", category: "hr" },
          { template: "Assign onboarding buddy to new hires", category: "hr" },
          { template: "Check in with new hires after first week", category: "hr" },
          { template: "Collect 30-day new hire feedback", category: "hr" }
        ]
      },
      {
        key: "hr_compensation",
        template: "Review compensation benchmarking data",
        contextKeys: [],
        followUps: [
          { template: "Identify roles below market compensation", category: "hr" },
          { template: "Prepare compensation adjustment proposal", category: "hr" },
          { template: "Review compensation budget impact", category: "finance" },
          { template: "Present compensation recommendations to leadership", category: "hr" }
        ]
      }
    ],

    /* ── Finance ── */
    finance: [
      {
        key: "fin_reconcile",
        template: "Reconcile accounts for {month}",
        contextKeys: ["month"],
        followUps: [
          { template: "Investigate discrepancies from {month} reconciliation", category: "finance" },
          { template: "Prepare {month} financial close report", category: "finance" },
          { template: "Update {month} variance analysis", category: "finance" },
          { template: "File {month} reconciliation documentation", category: "finance" }
        ]
      },
      {
        key: "fin_pnl",
        template: "Prepare monthly P&L statement",
        contextKeys: [],
        followUps: [
          { template: "Review P&L anomalies with department heads", category: "finance" },
          { template: "Present P&L to executive team", category: "finance" },
          { template: "Update annual forecast with P&L actuals", category: "finance" },
          { template: "Identify cost-saving opportunities from P&L", category: "operations" }
        ]
      },
      {
        key: "fin_expenses",
        template: "Review expense reports — batch #{num}",
        contextKeys: ["num"],
        followUps: [
          { template: "Flag policy violations in expense batch #{num}", category: "finance" },
          { template: "Process approved expenses from batch #{num}", category: "finance" },
          { template: "Update expense policy based on batch #{num} trends", category: "operations" },
          { template: "Send reimbursements for batch #{num}", category: "finance" }
        ]
      },
      {
        key: "fin_forecast",
        template: "Update financial forecast model",
        contextKeys: [],
        followUps: [
          { template: "Validate forecast assumptions with sales leadership", category: "sales" },
          { template: "Present updated forecast to board", category: "finance" },
          { template: "Align departmental budgets to new forecast", category: "finance" },
          { template: "Create scenario analysis from forecast model", category: "finance" }
        ]
      },
      {
        key: "fin_budget_audit",
        template: "Audit departmental budgets for Q{q}",
        contextKeys: ["q"],
        followUps: [
          { template: "Discuss Q{q} budget overruns with department leads", category: "finance" },
          { template: "Propose Q{q} budget reallocations", category: "finance" },
          { template: "Update Q{q} budget tracking dashboard", category: "finance" },
          { template: "Present Q{q} budget review to leadership", category: "finance" }
        ]
      },
      {
        key: "fin_investor",
        template: "Prepare quarterly investor report",
        contextKeys: [],
        followUps: [
          { template: "Get executive sign-off on investor report", category: "finance" },
          { template: "Distribute investor report to stakeholders", category: "finance" },
          { template: "Schedule investor Q&A follow-ups", category: "finance" },
          { template: "Update investor relations dashboard", category: "finance" }
        ]
      },
      {
        key: "fin_cash_flow",
        template: "Analyze cash flow projections",
        contextKeys: [],
        followUps: [
          { template: "Identify cash flow risks and mitigation plans", category: "finance" },
          { template: "Optimize payment terms with key vendors", category: "operations" },
          { template: "Review accounts receivable aging report", category: "finance" },
          { template: "Present cash flow outlook to leadership", category: "finance" }
        ]
      }
    ],

    /* ── Product ── */
    product: [
      {
        key: "prod_prd",
        template: "Write PRD for {feature} feature",
        contextKeys: ["feature"],
        followUps: [
          { template: "Review PRD for {feature} with engineering", category: "engineering" },
          { template: "Get stakeholder sign-off on {feature} PRD", category: "product" },
          { template: "Create design mockups for {feature}", category: "product" },
          { template: "Break down {feature} PRD into engineering tickets", category: "engineering" },
          { template: "Define success metrics for {feature}", category: "product" }
        ]
      },
      {
        key: "prod_backlog",
        template: "Prioritize backlog for sprint #{num}",
        contextKeys: ["num"],
        followUps: [
          { template: "Run sprint #{num} planning meeting", category: "product" },
          { template: "Write acceptance criteria for sprint #{num} stories", category: "product" },
          { template: "Coordinate sprint #{num} dependencies across teams", category: "product" },
          { template: "Set up sprint #{num} tracking board", category: "product" }
        ]
      },
      {
        key: "prod_research",
        template: "Conduct user research session #{num}",
        contextKeys: ["num"],
        followUps: [
          { template: "Synthesize findings from research session #{num}", category: "product" },
          { template: "Create user journey map from session #{num} insights", category: "product" },
          { template: "Share research session #{num} findings with team", category: "product" },
          { template: "Identify feature opportunities from research #{num}", category: "product" }
        ]
      },
      {
        key: "prod_wireframes",
        template: "Create wireframes for {feature}",
        contextKeys: ["feature"],
        followUps: [
          { template: "Run usability test on {feature} wireframes", category: "product" },
          { template: "Iterate {feature} wireframes based on feedback", category: "product" },
          { template: "Create high-fidelity designs for {feature}", category: "product" },
          { template: "Hand off {feature} designs to engineering", category: "engineering" }
        ]
      },
      {
        key: "prod_roadmap",
        template: "Review and update product roadmap",
        contextKeys: [],
        followUps: [
          { template: "Communicate roadmap changes to stakeholders", category: "product" },
          { template: "Align engineering capacity with updated roadmap", category: "engineering" },
          { template: "Update marketing plans for roadmap changes", category: "marketing" },
          { template: "Create customer-facing roadmap summary", category: "product" }
        ]
      },
      {
        key: "prod_launch",
        template: "Plan product launch checklist for v{num}",
        contextKeys: ["num"],
        followUps: [
          { template: "Create v{num} launch marketing materials", category: "marketing" },
          { template: "Prepare v{num} release notes", category: "product" },
          { template: "Train support team on v{num} changes", category: "support" },
          { template: "Coordinate v{num} launch day activities", category: "operations" },
          { template: "Monitor v{num} launch metrics", category: "product" }
        ]
      },
      {
        key: "prod_feature_requests",
        template: "Triage customer feature requests — batch #{num}",
        contextKeys: ["num"],
        followUps: [
          { template: "Group feature requests #{num} by theme", category: "product" },
          { template: "Score and rank feature requests from batch #{num}", category: "product" },
          { template: "Respond to top-voted requests from batch #{num}", category: "support" },
          { template: "Add high-impact requests #{num} to roadmap", category: "product" }
        ]
      },
      {
        key: "prod_metrics",
        template: "Analyze feature usage metrics for {feature}",
        contextKeys: ["feature"],
        followUps: [
          { template: "Identify drop-off points in {feature} flow", category: "product" },
          { template: "Propose {feature} UX improvements based on data", category: "product" },
          { template: "Set up enhanced tracking for {feature}", category: "engineering" },
          { template: "Report {feature} adoption metrics to stakeholders", category: "product" }
        ]
      }
    ],

    /* ── Engineering ── */
    engineering: [
      {
        key: "eng_bug",
        template: "Fix bug #{num} in {module} module",
        contextKeys: ["num", "module"],
        followUps: [
          { template: "Write regression test for bug #{num} in {module}", category: "engineering" },
          { template: "Code review bug #{num} fix for {module}", category: "engineering" },
          { template: "Deploy bug #{num} fix to staging", category: "engineering" },
          { template: "Verify bug #{num} fix in production for {module}", category: "engineering" },
          { template: "Update {module} documentation after bug #{num} fix", category: "engineering" }
        ]
      },
      {
        key: "eng_code_review",
        template: "Code review PR #{num} for {module}",
        contextKeys: ["num", "module"],
        followUps: [
          { template: "Address review comments on PR #{num} for {module}", category: "engineering" },
          { template: "Run integration tests for PR #{num}", category: "engineering" },
          { template: "Merge and deploy PR #{num} for {module}", category: "engineering" },
          { template: "Monitor {module} metrics after PR #{num} deploy", category: "engineering" }
        ]
      },
      {
        key: "eng_refactor",
        template: "Refactor {module} module",
        contextKeys: ["module"],
        followUps: [
          { template: "Update unit tests for refactored {module}", category: "engineering" },
          { template: "Update API docs after {module} refactor", category: "engineering" },
          { template: "Performance test refactored {module}", category: "engineering" },
          { template: "Migrate dependent services to new {module} API", category: "engineering" }
        ]
      },
      {
        key: "eng_tests",
        template: "Write unit tests for {module}",
        contextKeys: ["module"],
        followUps: [
          { template: "Achieve 90% code coverage for {module}", category: "engineering" },
          { template: "Add integration tests for {module}", category: "engineering" },
          { template: "Set up CI test pipeline for {module}", category: "engineering" },
          { template: "Document {module} testing patterns", category: "engineering" }
        ]
      },
      {
        key: "eng_deploy",
        template: "Deploy hotfix to {env} environment",
        contextKeys: ["env"],
        followUps: [
          { template: "Monitor {env} health after hotfix deploy", category: "engineering" },
          { template: "Verify {env} hotfix with QA", category: "engineering" },
          { template: "Write post-mortem for {env} hotfix", category: "engineering" },
          { template: "Update runbook with {env} deploy learnings", category: "operations" }
        ]
      },
      {
        key: "eng_migrate",
        template: "Migrate {service} to new architecture",
        contextKeys: ["service"],
        followUps: [
          { template: "Run load tests on migrated {service}", category: "engineering" },
          { template: "Update monitoring dashboards for {service}", category: "engineering" },
          { template: "Deprecate legacy {service} endpoints", category: "engineering" },
          { template: "Train team on new {service} architecture", category: "engineering" },
          { template: "Update {service} documentation", category: "engineering" }
        ]
      },
      {
        key: "eng_security",
        template: "Conduct security audit for {module}",
        contextKeys: ["module"],
        followUps: [
          { template: "Fix vulnerabilities found in {module} audit", category: "engineering", priority: "critical" },
          { template: "Update security policies for {module}", category: "operations" },
          { template: "Schedule penetration test for {module}", category: "engineering" },
          { template: "Document {module} security improvements", category: "engineering" }
        ]
      },
      {
        key: "eng_design_doc",
        template: "Write technical design doc for {feature}",
        contextKeys: ["feature"],
        followUps: [
          { template: "Review {feature} design doc with team", category: "engineering" },
          { template: "Create implementation plan for {feature}", category: "engineering" },
          { template: "Estimate engineering effort for {feature}", category: "engineering" },
          { template: "Set up {feature} project board and milestones", category: "product" }
        ]
      },
      {
        key: "eng_perf",
        template: "Investigate performance bottleneck in {service}",
        contextKeys: ["service"],
        followUps: [
          { template: "Implement fix for {service} performance issue", category: "engineering" },
          { template: "Add performance benchmarks for {service}", category: "engineering" },
          { template: "Set up alerting for {service} latency", category: "engineering" },
          { template: "Document {service} performance optimization", category: "engineering" }
        ]
      }
    ],

    /* ── Support ── */
    support: [
      {
        key: "sup_escalation",
        template: "Resolve escalated ticket #{num} for {company}",
        contextKeys: ["num", "company"],
        followUps: [
          { template: "Send resolution summary to {company} for ticket #{num}", category: "support" },
          { template: "Create knowledge base article from ticket #{num}", category: "support" },
          { template: "File bug report from {company} ticket #{num}", category: "engineering" },
          { template: "Follow up with {company} on ticket #{num} satisfaction", category: "support" }
        ]
      },
      {
        key: "sup_kb_article",
        template: "Update knowledge base article for {feature}",
        contextKeys: ["feature"],
        followUps: [
          { template: "Review {feature} KB article with product team", category: "product" },
          { template: "Add screenshots to {feature} KB article", category: "support" },
          { template: "Translate {feature} KB article for localization", category: "support" },
          { template: "Link {feature} KB article in app help center", category: "engineering" }
        ]
      },
      {
        key: "sup_trends",
        template: "Analyze support ticket trends for {month}",
        contextKeys: ["month"],
        followUps: [
          { template: "Present {month} support trends to product team", category: "product" },
          { template: "Identify top {month} issues for engineering backlog", category: "engineering" },
          { template: "Create {month} customer satisfaction report", category: "support" },
          { template: "Propose process improvements from {month} trends", category: "operations" }
        ]
      },
      {
        key: "sup_training",
        template: "Train new support agent — module #{num}",
        contextKeys: ["num"],
        followUps: [
          { template: "Quiz new agent on module #{num} material", category: "support" },
          { template: "Shadow session for agent on module #{num} topics", category: "support" },
          { template: "Evaluate agent competency after module #{num}", category: "support" },
          { template: "Advance agent to module #{num} next level", category: "support" }
        ]
      },
      {
        key: "sup_troubleshooting",
        template: "Create troubleshooting guide for {feature}",
        contextKeys: ["feature"],
        followUps: [
          { template: "Test {feature} troubleshooting steps with real cases", category: "support" },
          { template: "Add {feature} troubleshooting guide to chatbot", category: "engineering" },
          { template: "Train support team on {feature} troubleshooting", category: "support" },
          { template: "Collect feedback on {feature} troubleshooting guide", category: "support" }
        ]
      },
      {
        key: "sup_faq",
        template: "Build FAQ for {feature} launch",
        contextKeys: ["feature"],
        followUps: [
          { template: "Publish {feature} FAQ to help center", category: "support" },
          { template: "Brief support team on {feature} FAQ", category: "support" },
          { template: "Monitor {feature} questions not covered by FAQ", category: "support" },
          { template: "Update {feature} FAQ based on launch feedback", category: "support" }
        ]
      },
      {
        key: "sup_triage",
        template: "Triage incoming tickets — batch #{num}",
        contextKeys: ["num"],
        followUps: [
          { template: "Assign priority tickets from batch #{num}", category: "support" },
          { template: "Escalate critical issues from batch #{num}", category: "support", priority: "high" },
          { template: "Send auto-responses for batch #{num} common issues", category: "support" },
          { template: "Report batch #{num} volume to leadership", category: "support" }
        ]
      },
      {
        key: "sup_eng_coord",
        template: "Coordinate with engineering on bug #{num} from {company}",
        contextKeys: ["num", "company"],
        followUps: [
          { template: "Get ETA from engineering on bug #{num}", category: "engineering" },
          { template: "Update {company} on bug #{num} progress", category: "support" },
          { template: "Verify bug #{num} fix resolves {company} issue", category: "support" },
          { template: "Close {company} ticket for bug #{num}", category: "support" }
        ]
      }
    ]
  };

  /* ══════════════════════════════════════
     Utility Helpers
     ══════════════════════════════════════ */

  /**
   * Returns a random integer between min (inclusive) and max (inclusive).
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random integer in [min, max]
   */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Picks a random element from an array.
   * @param {Array} arr - The source array
   * @returns {*} A random element
   */
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Picks N unique random elements from an array.
   * @param {Array} arr - The source array
   * @param {number} n  - Number of elements to pick
   * @returns {Array} Array of n unique elements (or fewer if arr is smaller)
   */
  function pickN(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, arr.length));
  }

  /**
   * Generates a unique ID string using timestamp + random suffix.
   * @returns {string} Unique identifier
   */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /**
   * Generates a random context value for a given placeholder key.
   * @param {string} key - The placeholder key (e.g., "company", "feature")
   * @returns {string|number} A random value appropriate for the key
   */
  function generateContextValue(key) {
    if (key === "q") return randInt(1, 4);
    if (key === "num") return randInt(100, 9999);
    if (key === "num2") return randInt(10, 200);
    const options = FILL_DATA[key];
    return options ? pick(options) : key;
  }

  /**
   * Builds a fresh context object for a given workflow template.
   * Generates random values for each placeholder the template requires.
   * @param {Object} workflowTemplate - A template definition from WORKFLOW_TEMPLATES
   * @returns {Object} Context map, e.g. { company: "Acme Corp", num: 4523 }
   */
  function buildContext(workflowTemplate) {
    const context = {};
    workflowTemplate.contextKeys.forEach(key => {
      context[key] = generateContextValue(key);
    });
    return context;
  }

  /**
   * Fills a template string using a provided context object.
   * Falls back to generating a random value if context is missing a key.
   * @param {string} template - Template string with {placeholder} tokens
   * @param {Object} context  - Key-value map of context values
   * @returns {string} Filled-in title string
   */
  function fillWithContext(template, context) {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      if (context[key] !== undefined) return context[key];
      // Fallback: generate a fresh value so templates always resolve
      return generateContextValue(key);
    });
  }

  /**
   * Generates a due date between 1 and 14 days from now.
   * @returns {string} ISO date string
   */
  function generateDueDate() {
    const now = new Date();
    now.setDate(now.getDate() + randInt(1, 14));
    return now.toISOString();
  }

  /**
   * Selects a priority based on an optional override or weighted randomness.
   * Higher-urgency tasks spawn more frequently from critical/high parent tasks.
   * @param {string|null} override  - Explicit priority to use
   * @param {string|null} parentPri - The parent task's priority (for inheritance)
   * @returns {string} Priority id
   */
  function selectPriority(override, parentPri) {
    if (override) return override;

    // Inherit tendency from parent: 40% same, 60% random
    if (parentPri && Math.random() < 0.4) return parentPri;

    // Weighted random: critical 10%, high 25%, medium 40%, low 25%
    const roll = Math.random();
    if (roll < 0.10) return "critical";
    if (roll < 0.35) return "high";
    if (roll < 0.75) return "medium";
    return "low";
  }

  /* ══════════════════════════════════════
     Task Creation
     ══════════════════════════════════════ */

  /**
   * Creates a task from a specific workflow template with fresh context.
   * The task object stores both its templateKey and context for later use
   * when generating contextual follow-ups.
   * @param {string} categoryId       - The category to pick a template from
   * @param {string|null} parentId    - Parent task ID (null for initial tasks)
   * @returns {Object} A fully formed task object with context metadata
   */
  function createTask(categoryId = null, parentId = null) {
    const catId = categoryId || pick(CATEGORIES).id;
    const templates = WORKFLOW_TEMPLATES[catId];

    if (!templates || templates.length === 0) {
      // Fallback for any edge case
      return createFallbackTask(catId, parentId);
    }

    const wfTemplate = pick(templates);
    const context = buildContext(wfTemplate);
    const title = fillWithContext(wfTemplate.template, context);

    return {
      id: generateId(),
      title,
      category: catId,
      priority: selectPriority(null, null),
      dueDate: generateDueDate(),
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
      parentId,
      // Context metadata — used by spawnFollowUps
      templateKey: wfTemplate.key,
      context: context
    };
  }

  /**
   * Fallback task creation for edge cases where no workflow templates exist.
   * @param {string} catId    - Category ID
   * @param {string|null} parentId - Parent task ID
   * @returns {Object} A basic task object
   */
  function createFallbackTask(catId, parentId) {
    return {
      id: generateId(),
      title: `Complete pending ${catId} task`,
      category: catId,
      priority: selectPriority(null, null),
      dueDate: generateDueDate(),
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
      parentId,
      templateKey: null,
      context: {}
    };
  }

  /**
   * Generates the initial batch of tasks for a new user.
   * Creates one task per category plus a few extras for a full backlog.
   * @returns {Array<Object>} Array of 10-12 task objects
   */
  function generateInitialTasks() {
    const tasks = [];

    // One task per category to start
    CATEGORIES.forEach(cat => {
      tasks.push(createTask(cat.id, null));
    });

    // Add a few extra random ones for variety
    const extra = randInt(2, 4);
    for (let i = 0; i < extra; i++) {
      tasks.push(createTask(null, null));
    }

    return tasks;
  }

  /* ══════════════════════════════════════
     Context-Aware Follow-Up Spawning
     ══════════════════════════════════════ */

  /**
   * Spawns 1-3 context-aware follow-up tasks when a task is completed.
   * 
   * This is the core of the "never-ending" loop. It works in three tiers:
   * 
   * 1. PRIMARY (70%): Picks from the completed task's defined follow-up 
   *    templates, injecting the SAME context (company, feature, etc.)
   *    so follow-ups are logically related.
   * 
   * 2. CROSS-CATEGORY (20%): Picks a contextual follow-up that belongs
   *    to a DIFFERENT category, representing cross-team collaboration
   *    (e.g., sales close → finance invoice).
   * 
   * 3. FRESH (10%): Generates an entirely new task to keep things varied
   *    and prevent the task list from becoming too narrow.
   * 
   * @param {Object} completedTask - The task that was just completed
   * @returns {Array<Object>} Array of 1-3 new contextual task objects
   */
  function spawnFollowUps(completedTask) {
    const count = randInt(1, 3);
    const newTasks = [];
    const usedTemplates = new Set(); // Avoid duplicate follow-ups

    // Try to find the workflow template for the completed task
    const wfTemplate = findWorkflowTemplate(completedTask.templateKey, completedTask.category);
    const parentContext = completedTask.context || {};
    const parentPriority = completedTask.priority;

    for (let i = 0; i < count; i++) {
      const roll = Math.random();

      if (wfTemplate && wfTemplate.followUps.length > 0 && roll < 0.70) {
        // TIER 1: Contextual follow-up from same workflow
        const task = spawnContextualFollowUp(
          wfTemplate, parentContext, parentPriority, completedTask.id, usedTemplates
        );
        if (task) {
          newTasks.push(task);
          continue;
        }
      }

      if (wfTemplate && wfTemplate.followUps.length > 0 && roll < 0.90) {
        // TIER 2: Cross-category contextual follow-up
        const crossCat = wfTemplate.followUps.filter(
          f => f.category !== completedTask.category && !usedTemplates.has(f.template)
        );
        if (crossCat.length > 0) {
          const followUp = pick(crossCat);
          usedTemplates.add(followUp.template);
          newTasks.push(buildFollowUpTask(followUp, parentContext, parentPriority, completedTask.id));
          continue;
        }
      }

      // TIER 3: Fresh task (same category bias)
      const useSameCategory = Math.random() < 0.5;
      const catId = useSameCategory ? completedTask.category : null;
      newTasks.push(createTask(catId, completedTask.id));
    }

    return newTasks;
  }

  /**
   * Finds the workflow template definition by key and category.
   * @param {string|null} templateKey - The template key stored on the task
   * @param {string} categoryId       - The task's category
   * @returns {Object|null} The matching workflow template, or null
   */
  function findWorkflowTemplate(templateKey, categoryId) {
    if (!templateKey) return null;

    // Search in the task's category first (most common case)
    const categoryTemplates = WORKFLOW_TEMPLATES[categoryId];
    if (categoryTemplates) {
      const match = categoryTemplates.find(t => t.key === templateKey);
      if (match) return match;
    }

    // Fallback: search all categories (in case of mismatched data)
    for (const catId of Object.keys(WORKFLOW_TEMPLATES)) {
      const match = WORKFLOW_TEMPLATES[catId].find(t => t.key === templateKey);
      if (match) return match;
    }

    return null;
  }

  /**
   * Picks and builds a contextual follow-up task from the same workflow.
   * Re-uses the parent task's context values so entities carry forward.
   * @param {Object} wfTemplate     - The parent's workflow template definition
   * @param {Object} parentContext   - The parent task's context (company, feature, etc.)
   * @param {string} parentPriority  - The parent task's priority level
   * @param {string} parentId        - The parent task's ID
   * @param {Set} usedTemplates      - Set of already-used follow-up template strings
   * @returns {Object|null} A new task, or null if no unused follow-ups remain
   */
  function spawnContextualFollowUp(wfTemplate, parentContext, parentPriority, parentId, usedTemplates) {
    // Get follow-ups we haven't used yet in this spawn batch
    const available = wfTemplate.followUps.filter(f => !usedTemplates.has(f.template));
    if (available.length === 0) return null;

    const followUp = pick(available);
    usedTemplates.add(followUp.template);

    return buildFollowUpTask(followUp, parentContext, parentPriority, parentId);
  }

  /**
   * Constructs a task object from a follow-up definition and parent context.
   * The new task inherits the parent's context and gets its own workflow key
   * so IT can also spawn contextual follow-ups when completed later.
   * @param {Object} followUpDef    - Follow-up definition { template, category, priority? }
   * @param {Object} parentContext   - Context inherited from the parent task
   * @param {string} parentPriority  - Parent task's priority
   * @param {string} parentId        - Parent task's ID
   * @returns {Object} A fully formed task object
   */
  function buildFollowUpTask(followUpDef, parentContext, parentPriority, parentId) {
    const title = fillWithContext(followUpDef.template, parentContext);
    const category = followUpDef.category;
    const priority = selectPriority(followUpDef.priority || null, parentPriority);

    // Try to find a matching workflow template in the target category
    // so this follow-up can ALSO spawn its own contextual follow-ups
    const nextWfTemplate = findBestMatchingTemplate(title, category);

    return {
      id: generateId(),
      title,
      category,
      priority,
      dueDate: generateDueDate(),
      createdAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
      parentId,
      templateKey: nextWfTemplate ? nextWfTemplate.key : null,
      context: { ...parentContext } // Carry context forward
    };
  }

  /**
   * Finds the best matching workflow template for a follow-up task title.
   * Uses keyword overlap scoring to match the generated title to an
   * existing template, allowing the chain to continue indefinitely.
   * @param {string} title      - The generated task title
   * @param {string} categoryId - The category to search in
   * @returns {Object|null} Best matching workflow template, or null
   */
  function findBestMatchingTemplate(title, categoryId) {
    const templates = WORKFLOW_TEMPLATES[categoryId];
    if (!templates || templates.length === 0) return null;

    const titleWords = title.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    let bestMatch = null;
    let bestScore = 0;

    for (const tmpl of templates) {
      const tmplWords = tmpl.template.toLowerCase().split(/\W+/).filter(w => w.length > 2);
      // Count overlapping keywords (ignoring placeholders)
      const overlap = titleWords.filter(w => tmplWords.includes(w)).length;
      if (overlap > bestScore) {
        bestScore = overlap;
        bestMatch = tmpl;
      }
    }

    // Require at least 2 keyword matches for a meaningful link
    return bestScore >= 2 ? bestMatch : pick(templates);
  }

  /* ══════════════════════════════════════
     Public API
     ══════════════════════════════════════ */

  return {
    CATEGORIES,
    PRIORITIES,
    generateInitialTasks,
    spawnFollowUps,
    createTask,
    generateId
  };

})();
