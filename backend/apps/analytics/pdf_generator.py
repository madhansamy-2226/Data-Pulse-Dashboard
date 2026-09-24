import os
from datetime import datetime
from decimal import Decimal
from django.conf import settings
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)

class SalesPulsePDFReport:
    """
    Generates professional, styled sales analytics PDF reports using ReportLab.
    """
    def __init__(self, filename_prefix="salespulse_report"):
        self.filename_prefix = filename_prefix
        self.output_dir = os.path.join(settings.MEDIA_ROOT, 'reports')
        os.makedirs(self.output_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.file_name = f"{filename_prefix}_{timestamp}.pdf"
        self.file_path = os.path.join(self.output_dir, self.file_name)

    def generate(self, user, summary_data, top_products, category_data, trends_data, filters=None):
        doc = SimpleDocTemplate(
            self.file_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = getSampleStyleSheet()
        
        # Custom typography styles
        primary_color = colors.HexColor("#2563eb") # Blue-600
        secondary_color = colors.HexColor("#1e293b") # Slate-800
        accent_color = colors.HexColor("#10b981") # Emerald-500
        light_bg = colors.HexColor("#f8fafc") # Slate-50
        border_color = colors.HexColor("#e2e8f0")

        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=secondary_color,
            fontName='Helvetica-Bold'
        )
        
        subtitle_style = ParagraphStyle(
            'DocSubTitle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#64748b"),
        )

        section_heading = ParagraphStyle(
            'SectionHead',
            parent=styles['Heading2'],
            fontSize=14,
            leading=18,
            textColor=secondary_color,
            fontName='Helvetica-Bold',
            spaceBefore=14,
            spaceAfter=6,
        )

        table_header_style = ParagraphStyle(
            'TableHeader',
            parent=styles['Normal'],
            fontSize=9,
            leading=11,
            textColor=colors.white,
            fontName='Helvetica-Bold',
            alignment=1
        )

        table_body_style = ParagraphStyle(
            'TableBody',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=secondary_color,
        )

        story = []

        # Header Title Banner
        story.append(Paragraph("SalesPulse Executive Analytics Report", title_style))
        story.append(Paragraph(
            f"Generated on: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')} | Organization: {getattr(user, 'company_name', 'SalesPulse Enterprise') or 'SalesPulse'} | User: {user.email}",
            subtitle_style
        ))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=15))

        # KPI Summary Cards Grid
        story.append(Paragraph("Key Performance Indicators (KPIs)", section_heading))
        
        rev = f"${float(summary_data.get('total_revenue', 0)):,.2f}"
        orders = f"{summary_data.get('total_orders', 0):,}"
        aov = f"${float(summary_data.get('average_order_value', 0)):,.2f}"
        top_cat = str(summary_data.get('top_category', 'N/A'))
        
        kpi_data = [
            [
                Paragraph("<b>Total Revenue</b>", table_body_style),
                Paragraph("<b>Total Orders</b>", table_body_style),
                Paragraph("<b>Avg Order Value</b>", table_body_style),
                Paragraph("<b>Top Category</b>", table_body_style)
            ],
            [
                Paragraph(f"<font size=13 color='#2563eb'><b>{rev}</b></font>", table_body_style),
                Paragraph(f"<font size=13 color='#0f172a'><b>{orders}</b></font>", table_body_style),
                Paragraph(f"<font size=13 color='#10b981'><b>{aov}</b></font>", table_body_style),
                Paragraph(f"<font size=12 color='#6366f1'><b>{top_cat}</b></font>", table_body_style)
            ]
        ]
        
        kpi_table = Table(kpi_data, colWidths=[135, 135, 135, 135])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), light_bg),
            ('BOX', (0, 0), (-1, -1), 1, border_color),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 15))

        # Category Breakdown Table
        story.append(Paragraph("Category Performance Breakdown", section_heading))
        cat_table_rows = [
            [
                Paragraph("Category", table_header_style),
                Paragraph("Revenue ($)", table_header_style),
                Paragraph("Units Sold", table_header_style),
                Paragraph("Share of Revenue", table_header_style)
            ]
        ]
        
        tot_rev_float = float(summary_data.get('total_revenue', 0)) or 1.0
        for item in category_data[:8]:
            cat_name = item.get('category', 'Unknown')
            cat_rev = float(item.get('total_revenue', 0))
            cat_units = item.get('total_quantity', 0)
            share = (cat_rev / tot_rev_float) * 100
            
            cat_table_rows.append([
                Paragraph(cat_name, table_body_style),
                Paragraph(f"${cat_rev:,.2f}", table_body_style),
                Paragraph(f"{cat_units:,}", table_body_style),
                Paragraph(f"{share:.1f}%", table_body_style)
            ])
            
        if len(cat_table_rows) > 1:
            cat_table = Table(cat_table_rows, colWidths=[180, 120, 120, 120])
            cat_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), primary_color),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('GRID', (0, 0), (-1, -1), 0.5, border_color),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_bg]),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(cat_table)
        else:
            story.append(Paragraph("No category data available.", table_body_style))
            
        story.append(Spacer(1, 15))

        # Top 10 Products Table
        story.append(Paragraph("Top 10 High-Performing Products", section_heading))
        prod_table_rows = [
            [
                Paragraph("#", table_header_style),
                Paragraph("Product Name", table_header_style),
                Paragraph("Category", table_header_style),
                Paragraph("Units Sold", table_header_style),
                Paragraph("Total Revenue ($)", table_header_style),
            ]
        ]
        
        for idx, prod in enumerate(top_products[:10], start=1):
            p_name = prod.get('product_name', 'Unknown')
            p_cat = prod.get('category', 'General')
            p_units = prod.get('total_quantity', 0)
            p_rev = float(prod.get('total_revenue', 0))
            
            prod_table_rows.append([
                Paragraph(str(idx), table_body_style),
                Paragraph(p_name, table_body_style),
                Paragraph(p_cat, table_body_style),
                Paragraph(f"{p_units:,}", table_body_style),
                Paragraph(f"${p_rev:,.2f}", table_body_style),
            ])
            
        if len(prod_table_rows) > 1:
            prod_table = Table(prod_table_rows, colWidths=[30, 210, 110, 80, 110])
            prod_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), secondary_color),
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
                ('GRID', (0, 0), (-1, -1), 0.5, border_color),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_bg]),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(prod_table)
        else:
            story.append(Paragraph("No product data available.", table_body_style))

        # Footer Note
        story.append(Spacer(1, 20))
        story.append(HRFlowable(width="100%", thickness=0.5, color=border_color, spaceAfter=10))
        story.append(Paragraph(
            "Confidential • Generated automatically by SalesPulse Analytics Worker Pipeline",
            ParagraphStyle('Footer', parent=subtitle_style, alignment=1)
        ))

        doc.build(story)
        return self.file_path, self.file_name
