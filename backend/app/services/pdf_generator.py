import io
import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from typing import List, Optional
from datetime import datetime

from app.models.outing import Outing
from app.models.packing_list import OutingPackingList


class PDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        
        # Colors
        self.bsa_olive = colors.HexColor('#6F784B')
        self.dark_gray = colors.HexColor('#2E2E2E')
        self.light_gray = colors.HexColor('#F5F5F5')
        
        self.styles.add(ParagraphStyle(
            name='Header1',
            parent=self.styles['Heading1'],
            fontSize=28,
            leading=34,
            spaceAfter=20,
            textColor=self.bsa_olive,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            leading=18,
            spaceBefore=15,
            spaceAfter=10,
            textColor=colors.white,
            backColor=self.bsa_olive,
            borderPadding=8,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='CardTitle',
            parent=self.styles['Heading3'],
            fontSize=12,
            leading=14,
            textColor=self.bsa_olive,
            spaceAfter=6,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='Label',
            parent=self.styles['Normal'],
            fontSize=9,
            leading=11,
            textColor=colors.HexColor('#666666'),
            fontName='Helvetica-Bold',
            spaceAfter=2
        ))
        
        self.styles.add(ParagraphStyle(
            name='Value',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=13,
            textColor=colors.black,
            spaceAfter=8
        ))
        
        self.styles.add(ParagraphStyle(
            name='CheckboxItem',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=14,
            spaceAfter=4,
            textColor=self.dark_gray
        ))

    def _generate_qr_code(self, data: str) -> io.BytesIO:
        """Generate a QR code image stream"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=1,
        )
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        img_buffer = io.BytesIO()
        img.save(img_buffer, format="PNG")
        img_buffer.seek(0)
        return img_buffer

    def generate_outing_handout(self, outing: Outing, packing_lists: List[OutingPackingList]) -> bytes:
        """Generate a PDF handout for the outing"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        story = []
        
        # Title
        story.append(Paragraph(outing.name, self.styles['Header1']))
        story.append(Spacer(1, 10))
        
        # 5Ws Section
        story.append(Paragraph("TRIP DETAILS", self.styles['SectionHeader']))
        story.append(Spacer(1, 5))
        
        # Helper to create a card content
        def create_card_content(title, items):
            content = [Paragraph(title, self.styles['CardTitle'])]
            for label, value in items:
                if label:
                    content.append(Paragraph(label, self.styles['Label']))
                if value:
                    if isinstance(value, list):
                        for v in value:
                            content.append(Paragraph(v, self.styles['Value']))
                    else:
                        content.append(Paragraph(value, self.styles['Value']))
            return content

        # WHO
        who_items = [
            ("Outing Lead:", f"{outing.outing_lead_name or 'TBD'}"),
            ("Contact:", f"{outing.outing_lead_phone or 'No phone'}"),
            ("Participants:", "All Scouts and Leaders")
        ]
        
        # WHAT
        what_items = [
            ("Description:", outing.description or "No description provided.")
        ]
        
        # WHEN
        start_date = outing.outing_date.strftime("%B %d, %Y")
        end_date = outing.end_date.strftime("%B %d, %Y") if outing.end_date else start_date
        date_str = f"{start_date} - {end_date}" if start_date != end_date else start_date
        
        when_items = [
            ("Dates:", date_str),
            ("Drop-off:", outing.drop_off_time.strftime("%I:%M %p") if outing.drop_off_time else "TBD"),
            ("Pick-up:", outing.pickup_time.strftime("%I:%M %p") if outing.pickup_time else "TBD")
        ]
        
        # WHY
        reqs_text = []
        if outing.outing_requirements:
            for req in outing.outing_requirements:
                reqs_text.append(f"• {req.requirement.rank} #{req.requirement.requirement_number}")
        
        if outing.outing_merit_badges:
            for mb in outing.outing_merit_badges:
                reqs_text.append(f"• Merit Badge: {mb.merit_badge.name}")
                
        if not reqs_text:
            reqs_text.append("Fun and fellowship!")
            
        why_items = [
            ("Requirements & Goals:", reqs_text)
        ]

        # Create sub-tables for the 2x2 grid
        def make_cell(content_list):
            return Table([[c] for c in content_list], 
                        style=[
                            ('LEFTPADDING', (0,0), (-1,-1), 10),
                            ('RIGHTPADDING', (0,0), (-1,-1), 10),
                            ('TOPPADDING', (0,0), (-1,-1), 10),
                            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
                        ])

        # Row 1: WHO | WHEN
        row1_data = [
            [make_cell(create_card_content("WHO", who_items)), 
             make_cell(create_card_content("WHEN", when_items))]
        ]
        
        t1 = Table(row1_data, colWidths=[3.75*inch, 3.75*inch])
        t1.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
            ('BACKGROUND', (0,0), (0,0), colors.white),
            ('BACKGROUND', (1,0), (1,0), colors.white),
        ]))
        story.append(t1)
        
        # Row 2: WHAT | WHY
        row2_data = [
            [make_cell(create_card_content("WHAT", what_items)), 
             make_cell(create_card_content("WHY", why_items))]
        ]
        
        t2 = Table(row2_data, colWidths=[3.75*inch, 3.75*inch])
        t2.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
        ]))
        story.append(t2)
        
        # WHERE Section
        story.append(Spacer(1, 15))
        story.append(Paragraph("LOCATIONS", self.styles['SectionHeader']))
        story.append(Spacer(1, 5))
        
        where_data = []
        
        # Helper to add location row
        def add_location_row(label, place_name, address, map_url=None):
            # Left column: Text details
            content = [Paragraph(label, self.styles['CardTitle'])]
            content.append(Paragraph(place_name or "TBD", self.styles['Value']))
            if address:
                content.append(Paragraph(address, self.styles['Label']))
            
            # Right column: QR Code
            qr_img = ""
            qr_data = map_url
            if not qr_data and address:
                qr_data = f"https://www.google.com/maps/search/?api=1&query={address.replace(' ', '+')}"
            
            if qr_data:
                qr_img = Image(self._generate_qr_code(qr_data), width=1.0*inch, height=1.0*inch)
            
            return [content, qr_img]

        # Trip Location
        loc_name = outing.location
        if outing.outing_place:
            loc_name = outing.outing_place.name
        
        addr = outing.outing_address
        if not addr and outing.outing_place:
            addr = outing.outing_place.address
            
        map_url = None
        if outing.outing_place and outing.outing_place.google_maps_url:
            map_url = outing.outing_place.google_maps_url
            
        where_data.append(add_location_row("DESTINATION", loc_name, addr, map_url))
        
        # Drop-off (if different)
        if outing.drop_off_location and outing.drop_off_location != loc_name:
             where_data.append(add_location_row("DROP-OFF", outing.drop_off_location, outing.dropoff_address))
             
        # Pick-up (if different)
        if outing.pickup_location and outing.pickup_location != loc_name and outing.pickup_location != outing.drop_off_location:
             where_data.append(add_location_row("PICK-UP", outing.pickup_location, outing.pickup_address))

        # Render Where Table
        if where_data:
            # Convert content lists to Cells
            final_where_data = []
            for row in where_data:
                text_cell = Table([[c] for c in row[0]], style=[('LEFTPADDING', (0,0), (-1,-1), 0)])
                final_where_data.append([text_cell, row[1]])
                
            t_where = Table(final_where_data, colWidths=[6.0*inch, 1.5*inch])
            t_where.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('ALIGN', (1,0), (1,-1), 'CENTER'),
                ('LEFTPADDING', (0,0), (-1,-1), 10),
                ('RIGHTPADDING', (0,0), (-1,-1), 10),
                ('TOPPADDING', (0,0), (-1,-1), 10),
                ('BOTTOMPADDING', (0,0), (-1,-1), 10),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
            ]))
            story.append(t_where)
        
        # Packing List Section
        story.append(Spacer(1, 15))
        story.append(Paragraph("PACKING LIST", self.styles['SectionHeader']))
        story.append(Spacer(1, 5))
        
        if not packing_lists:
            story.append(Paragraph("No packing list specified for this outing.", self.styles['Normal']))
        else:
            # Collect all items
            all_items = []
            for pl in packing_lists:
                for item in pl.items:
                    all_items.append(item)
            
            # Sort items by name
            all_items.sort(key=lambda x: x.name)
            
            # Create 2-column list
            col1 = []
            col2 = []
            mid = (len(all_items) + 1) // 2
            
            for i, item in enumerate(all_items):
                qty_str = f" ({item.quantity})" if item.quantity > 1 else ""
                # Use a cleaner checkbox visual
                text = f"<font name='ZapfDingbats'>o</font>  {item.name}{qty_str}"
                p = Paragraph(text, self.styles['CheckboxItem'])
                if i < mid:
                    col1.append(p)
                else:
                    col2.append(p)
            
            # Make sure columns are equal length for table
            while len(col2) < len(col1):
                col2.append("")
                
            list_data = []
            for c1, c2 in zip(col1, col2):
                list_data.append([c1, c2])
                
            if list_data:
                t_list = Table(list_data, colWidths=[3.75*inch, 3.75*inch])
                t_list.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('LEFTPADDING', (0,0), (-1,-1), 10),
                    ('RIGHTPADDING', (0,0), (-1,-1), 10),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
                ]))
                story.append(t_list)
        
        # Footer
        story.append(Spacer(1, 30))
        story.append(Paragraph("Trailhead - Scout Outing Manager", 
                              ParagraphStyle('Footer', parent=self.styles['Normal'], fontSize=8, textColor=colors.gray, alignment=TA_CENTER)))
        
        doc.build(story)
        return buffer.getvalue()

pdf_generator = PDFGenerator()
