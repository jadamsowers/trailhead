"""
PDF generation utilities for outing rosters.
Creates attractive, printable check-in sheets for outing leaders.
"""
from io import BytesIO
from datetime import datetime
from typing import List
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT


def generate_outing_roster_pdf(outing_data: dict, signups: List[dict]) -> BytesIO:
    """
    Generate a PDF roster for a outing with checkboxes for check-in.
    
    Args:
        outing_data: Dictionary containing outing information (name, date, location, etc.)
        signups: List of signup dictionaries with participant information
        
    Returns:
        BytesIO object containing the PDF data
    """
    buffer = BytesIO()
    
    # Use landscape orientation for better table layout
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        rightMargin=0.5*inch,
        leftMargin=0.5*inch,
        topMargin=0.75*inch,
        bottomMargin=0.5*inch
    )
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1a5490'),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#333333'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#666666'),
        spaceAfter=6,
        alignment=TA_LEFT,
        fontName='Helvetica'
    )
    
    # Add title
    title = Paragraph(f"<b>{outing_data['name']}</b>", title_style)
    elements.append(title)
    
    # Add outing details
    outing_date = datetime.fromisoformat(outing_data['outing_date'].replace('Z', '+00:00'))
    date_str = outing_date.strftime('%B %d, %Y')
    
    if outing_data.get('end_date'):
        end_date = datetime.fromisoformat(outing_data['end_date'].replace('Z', '+00:00'))
        date_str += f" - {end_date.strftime('%B %d, %Y')}"
    
    subtitle = Paragraph(
        f"{date_str} | {outing_data['location']}",
        subtitle_style
    )
    elements.append(subtitle)
    elements.append(Spacer(1, 0.1*inch))
    
    # Add outing leader info if available
    if outing_data.get('outing_lead_name'):
        leader_info = f"<b>Outing Leader:</b> {outing_data['outing_lead_name']}"
        if outing_data.get('outing_lead_phone'):
            leader_info += f" | <b>Phone:</b> {outing_data['outing_lead_phone']}"
        if outing_data.get('outing_lead_email'):
            leader_info += f" | <b>Email:</b> {outing_data['outing_lead_email']}"
        elements.append(Paragraph(leader_info, header_style))
        elements.append(Spacer(1, 0.1*inch))
    
    # Prepare participant data for table
    # Separate scouts and adults
    scouts = []
    adults = []
    
    for signup in signups:
        for participant in signup['participants']:
            participant_data = {
                'name': participant['name'],
                'age': participant['age'],
                'type': participant['participant_type'],
                'gender': participant['gender'],
                'troop': participant.get('troop_number', ''),
                'patrol': participant.get('patrol_name', ''),
                'dietary': ', '.join(participant.get('dietary_preferences', [])),
                'allergies': ', '.join(participant.get('allergies', [])),
                'vehicle': participant.get('vehicle_capacity', 0),
                'yp_training': participant.get('has_youth_protection', False),
                'family_contact': signup['family_contact_name'],
                'family_phone': signup['family_contact_phone']
            }
            
            if participant['participant_type'] == 'scout':
                scouts.append(participant_data)
            else:
                adults.append(participant_data)
    
    # Sort scouts by patrol, then name
    scouts.sort(key=lambda x: (x['patrol'] or '', x['name']))
    # Sort adults by name
    adults.sort(key=lambda x: x['name'])
    
    # Create Scouts table
    if scouts:
        elements.append(Paragraph("<b>SCOUTS</b>", header_style))
        elements.append(Spacer(1, 0.05*inch))
        
        scout_data = [
            ['☐', 'Name', 'Age', 'Troop', 'Patrol', 'Dietary/Allergies', 'Family Contact']
        ]
        
        for scout in scouts:
            dietary_info = []
            if scout['dietary']:
                dietary_info.append(f"Diet: {scout['dietary']}")
            if scout['allergies']:
                dietary_info.append(f"Allergies: {scout['allergies']}")
            dietary_str = '\n'.join(dietary_info) if dietary_info else ''
            
            scout_data.append([
                '☐',
                scout['name'],
                str(scout['age']),
                scout['troop'] or '',
                scout['patrol'] or '',
                dietary_str,
                f"{scout['family_contact']}\n{scout['family_phone']}"
            ])
        
        scout_table = Table(scout_data, colWidths=[0.4*inch, 2*inch, 0.5*inch, 0.7*inch, 1.2*inch, 2.2*inch, 1.8*inch])
        scout_table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5490')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            
            # Checkbox column
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),
            ('FONTSIZE', (0, 1), (0, -1), 14),
            
            # Data rows
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (1, 1), (1, -1), 'LEFT'),
            ('ALIGN', (2, 1), (2, -1), 'CENTER'),
            ('ALIGN', (3, 1), (3, -1), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#1a5490')),
            
            # Alternating row colors
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f0f0')]),
            
            # Padding
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ]))
        
        elements.append(scout_table)
        elements.append(Spacer(1, 0.3*inch))
    
    # Create Adults table
    if adults:
        elements.append(Paragraph("<b>ADULTS</b>", header_style))
        elements.append(Spacer(1, 0.05*inch))
        
        adult_data = [
            ['☐', 'Name', 'Gender', 'YP Training', 'Vehicle Capacity', 'Dietary/Allergies', 'Contact']
        ]
        
        for adult in adults:
            dietary_info = []
            if adult['dietary']:
                dietary_info.append(f"Diet: {adult['dietary']}")
            if adult['allergies']:
                dietary_info.append(f"Allergies: {adult['allergies']}")
            dietary_str = '\n'.join(dietary_info) if dietary_info else ''
            
            yp_status = '✓' if adult['yp_training'] else '✗'
            vehicle_str = str(adult['vehicle']) if adult['vehicle'] > 0 else ''
            
            adult_data.append([
                '☐',
                adult['name'],
                adult['gender'].capitalize(),
                yp_status,
                vehicle_str,
                dietary_str,
                f"{adult['family_contact']}\n{adult['family_phone']}"
            ])
        
        adult_table = Table(adult_data, colWidths=[0.4*inch, 2*inch, 0.8*inch, 0.9*inch, 1.2*inch, 2.2*inch, 1.8*inch])
        adult_table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d7a3e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            
            # Checkbox column
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),
            ('FONTSIZE', (0, 1), (0, -1), 14),
            
            # Data rows
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (1, 1), (1, -1), 'LEFT'),
            ('ALIGN', (2, 1), (4, -1), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#2d7a3e')),
            
            # Alternating row colors
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f0f0')]),
            
            # Padding
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ]))
        
        elements.append(adult_table)
    
    # Add summary footer
    elements.append(Spacer(1, 0.3*inch))
    summary_text = f"<b>Total Participants:</b> {len(scouts) + len(adults)} | <b>Scouts:</b> {len(scouts)} | <b>Adults:</b> {len(adults)}"
    if adults:
        total_vehicle_capacity = sum(a['vehicle'] for a in adults)
        summary_text += f" | <b>Total Vehicle Capacity:</b> {total_vehicle_capacity} seats"
    
    elements.append(Paragraph(summary_text, header_style))
    
    # Add generation timestamp
    elements.append(Spacer(1, 0.1*inch))
    timestamp = datetime.now().strftime('%B %d, %Y at %I:%M %p')
    elements.append(Paragraph(f"<i>Generated on {timestamp}</i>", header_style))
    
    # Build PDF
    doc.build(elements)
    
    # Get the value of the BytesIO buffer
    buffer.seek(0)
    return buffer