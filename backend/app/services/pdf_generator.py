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
        self.styles.add(ParagraphStyle(
            name='Header1',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=20,
            textColor=colors.HexColor('#6F784B'),  # BSA Olive
            alignment=TA_CENTER
        ))
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceBefore=15,
            spaceAfter=10,
            textColor=colors.HexColor('#2E2E2E'),
            borderPadding=5,
            borderColor=colors.HexColor('#6F784B'),
            borderWidth=0,
            borderBottomWidth=1
        ))
        self.styles.add(ParagraphStyle(
            name='Label',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#666666'),
            fontName='Helvetica-Bold'
        ))
        self.styles.add(ParagraphStyle(
            name='Value',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#000000'),
            spaceAfter=5
        ))
        self.styles.add(ParagraphStyle(
            name='CheckboxItem',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=2
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
        story.append(Paragraph("Trip Details", self.styles['SectionHeader']))
        
        # WHO
        who_content = [
            [Paragraph("WHO", self.styles['Heading3'])],
            [Paragraph("Outing Lead:", self.styles['Label'])],
            [Paragraph(f"{outing.outing_lead_name or 'TBD'} ({outing.outing_lead_phone or 'No phone'})", self.styles['Value'])],
            [Paragraph("Participants:", self.styles['Label'])],
            [Paragraph("All Scouts and Leaders", self.styles['Value'])]
        ]
        
        # WHAT
        what_content = [
            [Paragraph("WHAT", self.styles['Heading3'])],
            [Paragraph(outing.description or "No description provided.", self.styles['Value'])]
        ]
        
        # WHEN
        start_date = outing.outing_date.strftime("%B %d, %Y")
        end_date = outing.end_date.strftime("%B %d, %Y") if outing.end_date else start_date
        date_str = f"{start_date} - {end_date}" if start_date != end_date else start_date
        
        when_content = [
            [Paragraph("WHEN", self.styles['Heading3'])],
            [Paragraph("Dates:", self.styles['Label'])],
            [Paragraph(date_str, self.styles['Value'])],
            [Paragraph("Drop-off:", self.styles['Label'])],
            [Paragraph(outing.drop_off_time or "TBD", self.styles['Value'])],
            [Paragraph("Pick-up:", self.styles['Label'])],
            [Paragraph(outing.pickup_time or "TBD", self.styles['Value'])]
        ]
        
        # WHY (Requirements)
        reqs_text = []
        if outing.outing_requirements:
            for req in outing.outing_requirements:
                reqs_text.append(f"• {req.requirement.rank} #{req.requirement.requirement_number}")
        
        if outing.outing_merit_badges:
            for mb in outing.outing_merit_badges:
                reqs_text.append(f"• Merit Badge: {mb.merit_badge.name}")
                
        if not reqs_text:
            reqs_text.append("Fun and fellowship!")
            
        why_content = [
            [Paragraph("WHY", self.styles['Heading3'])],
            [Paragraph("Requirements & Goals:", self.styles['Label'])],
            [Paragraph("<br/>".join(reqs_text), self.styles['Value'])]
        ]
        
        # WHERE (Addresses & QR Codes)
        where_rows = [[Paragraph("WHERE", self.styles['Heading3'])]]
        
        # Helper to add location row
        def add_location(label, place_name, address, map_url=None):
            content = [Paragraph(f"{label}:", self.styles['Label'])]
            content.append(Paragraph(place_name or "TBD", self.styles['Value']))
            if address:
                content.append(Paragraph(address, self.styles['Value']))
            
            cell_content = [content]
            
            # Add QR code if we have an address or URL
            qr_data = map_url
            if not qr_data and address:
                qr_data = f"https://www.google.com/maps/search/?api=1&query={address.replace(' ', '+')}"
            
            if qr_data:
                qr_img = Image(self._generate_qr_code(qr_data), width=1.2*inch, height=1.2*inch)
                return [content, qr_img]
            return [content, ""]

        # Trip Location
        loc_name = outing.location
        if outing.outing_place:
            loc_name = outing.outing_place.name
        
        # Use outing_address if available, otherwise try to get from place
        addr = outing.outing_address
        if not addr and outing.outing_place:
            addr = outing.outing_place.address
            
        map_url = None
        if outing.outing_place and outing.outing_place.google_maps_url:
            map_url = outing.outing_place.google_maps_url
            
        where_rows.append(add_location("Destination", loc_name, addr, map_url))
        
        # Drop-off (if different)
        if outing.drop_off_location and outing.drop_off_location != loc_name:
             where_rows.append(add_location("Drop-off", outing.drop_off_location, outing.dropoff_address))
             
        # Pick-up (if different)
        if outing.pickup_location and outing.pickup_location != loc_name and outing.pickup_location != outing.drop_off_location:
             where_rows.append(add_location("Pick-up", outing.pickup_location, outing.pickup_address))

        # Assemble 5Ws Table
        # Row 1: Who | When
        # Row 2: What | Why
        # Row 3: Where (Full width)
        
        # Create sub-tables for cells to handle multiple elements
        def make_cell(content_list):
            return Table([[c] for c in content_list], style=[('LEFTPADDING', (0,0), (-1,-1), 0)])

        # Layout logic
        # We'll use a main table with 2 columns
        
        data = [
            [make_cell(who_content), make_cell(when_content)],
            [make_cell(what_content), make_cell(why_content)],
        ]
        
        t = Table(data, colWidths=[3.75*inch, 3.75*inch])
        t.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
        ]))
        story.append(t)
        
        # Where section (separate table for full width)
        story.append(Spacer(1, 10))
        
        # Where table
        where_data = []
        for row in where_rows[1:]: # Skip header
            # row is [content_list, qr_image_or_empty]
            # Flatten content list for the cell
            text_col = row[0]
            qr_col = row[1]
            where_data.append([make_cell(text_col), qr_col])
            
        if where_data:
            story.append(Paragraph("WHERE", self.styles['Heading3']))
            t_where = Table(where_data, colWidths=[5.5*inch, 2*inch])
            t_where.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('ALIGN', (1,0), (1,-1), 'CENTER'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('BOTTOMPADDING', (0,0), (-1,-1), 15),
            ]))
            story.append(t_where)
        
        # Packing List Section
        story.append(Paragraph("Packing List", self.styles['SectionHeader']))
        
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
                # Use a square for checkbox
                checkbox = "☐" 
                text = f"{checkbox}  {item.name}{qty_str}"
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
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                ]))
                story.append(t_list)
        
        # Footer
        story.append(Spacer(1, 30))
        story.append(Paragraph("Trailhead - Scout Outing Manager", 
                              ParagraphStyle('Footer', parent=self.styles['Normal'], fontSize=8, textColor=colors.gray, alignment=TA_CENTER)))
        
        doc.build(story)
        return buffer.getvalue()

pdf_generator = PDFGenerator()
