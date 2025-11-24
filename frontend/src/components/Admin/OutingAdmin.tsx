import { OutingIconDisplay } from "../OutingIconDisplay";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Outing,
    OutingCreate,
    SignupResponse,
    ParticipantResponse,
    Place,
} from "../../types";
import { OutingIconPicker, suggestIconFromName } from "../OutingIconPicker";
import { outingAPI, pdfAPI, signupAPI } from "../../services/api";
import { formatPhoneNumber } from "../../utils/phoneUtils";
import OutingQRCode from "./OutingQRCode";
import OutingWizard from "./OutingWizard.tsx";
import { PlacePicker } from "./PlacePicker";

const OutingAdmin: React.FC = () => {
    // Helper function to format date, omitting year if it's the current year
    const formatOutingDate = (dateString: string): string => {
        const date = new Date(dateString);
        const currentYear = new Date().getFullYear();
        const dateYear = date.getFullYear();

        if (dateYear === currentYear) {
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });
        } else {
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        }
    };

    // Helper function to get next Friday-Sunday dates
    const getNextWeekendDates = () => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday

        // Calculate days until next Friday
        let daysUntilFriday = (5 - dayOfWeek + 7) % 7;
        if (daysUntilFriday === 0 && today.getDay() === 5) {
            // If today is Friday, get next Friday
            daysUntilFriday = 7;
        }

        const nextFriday = new Date(today);
        nextFriday.setDate(today.getDate() + daysUntilFriday);

        const nextSunday = new Date(nextFriday);
        nextSunday.setDate(nextFriday.getDate() + 2);

        // Format as YYYY-MM-DD for date input
        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };

        return {
            friday: formatDate(nextFriday),
            sunday: formatDate(nextSunday),
        };
    };

    const defaultDates = getNextWeekendDates();

    const [outings, setOutings] = useState<Outing[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedOutingId, setExpandedOutingId] = useState<string | null>(null);
    const [outingSignups, setOutingSignups] = useState<{
        [outingId: string]: SignupResponse[];
    }>({});
    const [loadingSignups, setLoadingSignups] = useState<{
        [outingId: string]: boolean;
    }>({});
    const [isCreateOutingExpanded, setIsCreateOutingExpanded] = useState(false);
    const [editingOutingId, setEditingOutingId] = useState<string | null>(null);
    const [editOuting, setEditOuting] = useState<OutingCreate | null>(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    // Address state for quick create form (wizard has its own)
    const [outingAddress, setOutingAddress] = useState<{
        address?: string;
        placeId?: string;
        place?: Place;
    }>({});
    const [pickupAddress, setPickupAddress] = useState<{
        address?: string;
        placeId?: string;
        place?: Place;
    }>({});
    const [dropoffAddress, setDropoffAddress] = useState<{
        address?: string;
        placeId?: string;
        place?: Place;
    }>({});

    // Email functionality state
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedOutingForEmail, setSelectedOutingForEmail] =
        useState<Outing | null>(null);
    const [emailList, setEmailList] = useState<string[]>([]);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailMessage, setEmailMessage] = useState("");
    const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

    // QR Code modal state
    const [showQRCode, setShowQRCode] = useState(false);
    const [qrCodeOuting, setQrCodeOuting] = useState<{
        id: string;
        name: string;
    } | null>(null);

    // Collapsible sections state
    const [collapsedLogistics, setCollapsedLogistics] = useState<{
        [outingId: string]: boolean;
    }>({});
    const [collapsedGear, setCollapsedGear] = useState<{
        [outingId: string]: boolean;
    }>({});
    const [collapsedActions, setCollapsedActions] = useState<{
        [outingId: string]: boolean;
    }>({});

    const [newOuting, setNewOuting] = useState<OutingCreate>({
        name: "",
        outing_date: defaultDates.friday,
        end_date: defaultDates.sunday,
        location: "",
        description: "",
        max_participants: 30,
        capacity_type: "vehicle",
        is_overnight: true,
        outing_lead_name: "",
        outing_lead_email: "",
        outing_lead_phone: "",
        drop_off_time: "",
        drop_off_location: "",
        pickup_time: "",
        pickup_location: "",
        cost: undefined,
        gear_list: "",
        icon: "",
    });

    // Load outings on component mount
    useEffect(() => {
        loadOutings();
    }, []);

    const loadOutings = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await outingAPI.getAll();
            // Sort outings by date (earliest first)
            const sortedData = [...data].sort(
                (a, b) =>
                    new Date(a.outing_date).getTime() - new Date(b.outing_date).getTime()
            );
            setOutings(sortedData);

            // Initialize collapsed state for actions (all collapsed by default)
            const initialCollapsedState: { [outingId: string]: boolean } = {};
            sortedData.forEach((outing) => {
                initialCollapsedState[outing.id] = true;
            });
            setCollapsedActions(initialCollapsedState);
        } catch (err) {
            console.error("Error loading outings:", err);
            const errorMessage =
                err instanceof Error ? err.message : "Failed to load outings";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const loadOutingSignups = async (outingId: string) => {
        if (outingSignups[outingId]) {
            // Already loaded
            return;
        }

        try {
            setLoadingSignups({ ...loadingSignups, [outingId]: true });
            const signups = await signupAPI.getByOuting(outingId);
            setOutingSignups({ ...outingSignups, [outingId]: signups });
        } catch (err) {
            console.error("Error loading signups:", err);
            const errorMessage =
                err instanceof Error ? err.message : "Failed to load signups";
            setError(errorMessage);
        } finally {
            setLoadingSignups({ ...loadingSignups, [outingId]: false });
        }
    };

    const handleOutingClick = async (outingId: string) => {
        if (expandedOutingId === outingId) {
            // Collapse
            setExpandedOutingId(null);
        } else {
            // Expand and load signups if not already loaded
            setExpandedOutingId(outingId);
            await loadOutingSignups(outingId);
        }
    };

    const handleIconChange = (icon: string) => {
        setNewOuting({ ...newOuting, icon });
    };

    const handleInputChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value, type } = e.target;

        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setNewOuting({
                ...newOuting,
                [name]: checked,
            });
        } else if (name === "max_participants") {
            setNewOuting({
                ...newOuting,
                [name]: parseInt(value) || 0,
            });
        } else if (name === "cost") {
            setNewOuting({
                ...newOuting,
                [name]: value === "" ? undefined : parseFloat(value),
            });
        } else if (name === "outing_lead_phone") {
            // Apply phone formatting
            setNewOuting({
                ...newOuting,
                [name]: formatPhoneNumber(value),
            });
        } else if (name === "name") {
            // Smart icon suggestion when name changes
            const suggestedIcon = suggestIconFromName(value);
            setNewOuting({
                ...newOuting,
                [name]: value,
                // Only auto-suggest if no icon has been manually selected yet
                icon: newOuting.icon === "" ? suggestedIcon : newOuting.icon,
            });
        } else {
            setNewOuting({
                ...newOuting,
                [name]: value,
            });
        }
    };

    const handleCreateOuting = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            await outingAPI.create({
                ...newOuting,
                outing_address: outingAddress.address,
                outing_place_id: outingAddress.placeId,
                pickup_address: pickupAddress.address,
                pickup_place_id: pickupAddress.placeId,
                dropoff_address: dropoffAddress.address,
                dropoff_place_id: dropoffAddress.placeId,
            });
            // Reset form with new default dates
            const newDefaultDates = getNextWeekendDates();
            setNewOuting({
                name: "",
                outing_date: newDefaultDates.friday,
                end_date: newDefaultDates.sunday,
                location: "",
                description: "",
                max_participants: 30,
                capacity_type: "vehicle",
                is_overnight: true,
                outing_lead_name: "",
                outing_lead_email: "",
                outing_lead_phone: "",
                drop_off_time: "",
                drop_off_location: "",
                pickup_time: "",
                pickup_location: "",
                cost: undefined,
                gear_list: "",
            });
            setOutingAddress({});
            setPickupAddress({});
            setDropoffAddress({});
            // Reload outings
            await loadOutings();
        } catch (err) {
            console.error("Error creating outing:", err);
            const errorMessage =
                err instanceof Error ? err.message : "Failed to create outing";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleEditOuting = (outing: Outing) => {
        setEditingOutingId(outing.id);
        setEditOuting({
            name: outing.name,
            outing_date: outing.outing_date,
            end_date: outing.end_date || "",
            location: outing.location,
            description: outing.description || "",
            max_participants: outing.max_participants,
            capacity_type: outing.capacity_type,
            is_overnight: outing.is_overnight,
            outing_lead_name: outing.outing_lead_name || "",
            outing_lead_email: outing.outing_lead_email || "",
            outing_lead_phone: outing.outing_lead_phone || "",
            drop_off_time: outing.drop_off_time || "",
            drop_off_location: outing.drop_off_location || "",
            pickup_time: outing.pickup_time || "",
            pickup_location: outing.pickup_location || "",
            cost: outing.cost,
            gear_list: outing.gear_list || "",
        });
        setExpandedOutingId(null);
    };

    const handleCancelEdit = () => {
        setEditingOutingId(null);
        setEditOuting(null);
    };

    const handleEditInputChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        if (!editOuting) return;

        const { name, value, type } = e.target;

        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setEditOuting({
                ...editOuting,
                [name]: checked,
            });
        } else if (name === "max_participants") {
            setEditOuting({
                ...editOuting,
                [name]: parseInt(value) || 0,
            });
        } else if (name === "cost") {
            setEditOuting({
                ...editOuting,
                [name]: value === "" ? undefined : parseFloat(value),
            });
        } else if (name === "outing_lead_phone") {
            // Apply phone formatting
            setEditOuting({
                ...editOuting,
                [name]: formatPhoneNumber(value),
            });
        } else if (name === "name") {
            // Smart icon suggestion when name changes (only if icon field exists and is empty)
            const suggestedIcon = suggestIconFromName(value);
            setEditOuting({
                ...editOuting,
                [name]: value,
                // Only auto-suggest if no icon has been set
                ...(editOuting.icon === "" && { icon: suggestedIcon }),
            });
        } else {
            setEditOuting({
                ...editOuting,
                [name]: value,
            });
        }
    };

    const handleUpdateOuting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOutingId || !editOuting) return;

        try {
            setLoading(true);
            setError(null);
            await outingAPI.update(editingOutingId, editOuting);
            setEditingOutingId(null);
            setEditOuting(null);
            await loadOutings();
        } catch (err) {
            console.error("Error updating outing:", err);
            const errorMessage =
                err instanceof Error ? err.message : "Failed to update outing";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOuting = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this outing?")) {
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await outingAPI.delete(id);
            await loadOutings();
        } catch (err) {
            console.error("Error deleting outing:", err);
            const errorMessage =
                err instanceof Error ? err.message : "Failed to delete outing";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleExportRosterPDF = async (
        outingId: string,
        outingName: string
    ) => {
        try {
            setLoading(true);
            setError(null);
            const blob = await pdfAPI.exportRosterPDF(outingId);
            pdfAPI.downloadPDF(blob, `${outingName.replace(/\s+/g, "_")}_roster.pdf`);
        } catch (err) {
            console.error("Error exporting roster PDF:", err);
            const errorMessage =
                err instanceof Error ? err.message : "Failed to export roster PDF";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadHandout = async (
        outingId: string,
        outingName: string
    ) => {
        try {
            setLoading(true);
            setError(null);
            const blob = await outingAPI.getOutingHandout(outingId);
            pdfAPI.downloadPDF(
                blob,
                `${outingName.replace(/\s+/g, "_")}_handout.pdf`
            );
        } catch (err) {
            console.error("Error downloading handout:", err);
            const errorMessage =
                err instanceof Error ? err.message : "Failed to download handout";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleShowQRCode = (outingId: string, outingName: string) => {
        setQrCodeOuting({ id: outingId, name: outingName });
        setShowQRCode(true);
    };

    const handleCloseQRCode = () => {
        setShowQRCode(false);
        setQrCodeOuting(null);
    };

    const handleShowEmailModal = async (outing: Outing) => {
        try {
            setLoading(true);
            setError(null);
            setEmailSuccess(null);

            // Load signups for this outing to get email addresses
            const signups = await signupAPI.getByOuting(outing.id);

            // Extract unique email addresses from family contacts
            const emails = new Set<string>();
            signups.forEach((signup) => {
                if (signup.family_contact_email) {
                    emails.add(signup.family_contact_email);
                }
            });

            setEmailList(Array.from(emails));
            setSelectedOutingForEmail(outing);
            setEmailSubject(`${outing.name} - Important Information`);
            setEmailMessage("");
            setShowEmailModal(true);
        } catch (err) {
            console.error("Error loading email data:", err);
            const errorMessage =
                err instanceof Error ? err.message : "Failed to load email data";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseEmailModal = () => {
        setShowEmailModal(false);
        setSelectedOutingForEmail(null);
        setEmailList([]);
        setEmailSubject("");
        setEmailMessage("");
        setEmailSuccess(null);
    };

    const handleCopyEmails = async () => {
        try {
            await navigator.clipboard.writeText(emailList.join(", "));
            setEmailSuccess("Email addresses copied to clipboard!");
            setTimeout(() => setEmailSuccess(null), 3000);
        } catch (err) {
            console.error("Error copying emails:", err);
            setError("Failed to copy email addresses");
        }
    };

    const handleSendEmail = () => {
        // Create mailto link with proper structure - recipients go directly after mailto:
        const mailtoLink = `mailto:${emailList.join(
            ","
        )}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(
            emailMessage
        )}`;
        window.location.href = mailtoLink;
        setEmailSuccess("Opening your email client...");
        setTimeout(() => {
            handleCloseEmailModal();
        }, 2000);
    };

    const renderParticipantsTable = (
        participants: ParticipantResponse[],
        isAdult: boolean
    ) => {
        return (
            <div style={{ overflowX: "auto" }}>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        backgroundColor: "var(--card-bg)",
                        border: "1px solid var(--card-border)",
                    }}
                >
                    <thead>
                        <tr style={{ backgroundColor: "var(--bg-tertiary)" }}>
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "left",
                                    borderBottom: "2px solid var(--card-border)",
                                }}
                            >
                                Name
                            </th>
                            {isAdult && (
                                <th
                                    style={{
                                        padding: "12px",
                                        textAlign: "left",
                                        borderBottom: "2px solid var(--card-border)",
                                    }}
                                >
                                    Vehicle Capacity
                                </th>
                            )}
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "left",
                                    borderBottom: "2px solid var(--card-border)",
                                }}
                            >
                                Dietary Restrictions
                            </th>
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "left",
                                    borderBottom: "2px solid var(--card-border)",
                                }}
                            >
                                Allergies
                            </th>
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "left",
                                    borderBottom: "2px solid var(--card-border)",
                                }}
                            >
                                Medical Notes
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map((participant, index) => (
                            <tr
                                key={participant.id}
                                style={{
                                    backgroundColor:
                                        index % 2 === 0 ? "var(--card-bg)" : "var(--bg-tertiary)",
                                    borderBottom: "1px solid var(--card-border)",
                                }}
                            >
                                <td style={{ padding: "12px", fontWeight: "bold" }}>
                                    {participant.name}
                                </td>
                                {isAdult && (
                                    <td style={{ padding: "12px" }}>
                                        {participant.vehicle_capacity > 0 ? (
                                            <span
                                                style={{
                                                    padding: "4px 8px",
                                                    backgroundColor: "var(--badge-success-bg)",
                                                    color: "var(--badge-success-text)",
                                                    borderRadius: "4px",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                🚗 {participant.vehicle_capacity} seats
                                            </span>
                                        ) : (
                                            <span style={{ color: "var(--text-muted)" }}>
                                                No vehicle
                                            </span>
                                        )}
                                    </td>
                                )}
                                <td style={{ padding: "12px" }}>
                                    {participant.dietary_restrictions.length > 0 ? (
                                        <div
                                            style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}
                                        >
                                            {participant.dietary_restrictions.map(
                                                (restriction, idx) => (
                                                    <span
                                                        key={idx}
                                                        style={{
                                                            padding: "2px 6px",
                                                            backgroundColor: "var(--badge-secondary-bg)",
                                                            border: "1px solid var(--badge-secondary-border)",
                                                            borderRadius: "3px",
                                                            fontSize: "11px",
                                                            color: "var(--badge-secondary-text)",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {restriction}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        <span style={{ color: "var(--text-muted)" }}>None</span>
                                    )}
                                </td>
                                <td style={{ padding: "12px" }}>
                                    {participant.allergies.length > 0 ? (
                                        <div
                                            style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}
                                        >
                                            {participant.allergies.map((allergy, idx) => (
                                                <span
                                                    key={idx}
                                                    style={{
                                                        padding: "2px 6px",
                                                        backgroundColor: "var(--card-error-bg)",
                                                        border: "1px solid var(--border-error)",
                                                        borderRadius: "3px",
                                                        fontSize: "11px",
                                                        color: "var(--color-error)",
                                                        fontWeight: "bold",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    ⚠️ {allergy}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={{ color: "var(--text-muted)" }}>None</span>
                                    )}
                                </td>
                                <td
                                    style={{
                                        padding: "12px",
                                        fontSize: "12px",
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    {participant.medical_notes || "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderOutingSignups = (outingId: string) => {
        const signups = outingSignups[outingId];
        const isLoading = loadingSignups[outingId];

        if (isLoading) {
            return (
                <p
                    style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "var(--text-secondary)",
                    }}
                >
                    Loading participants...
                </p>
            );
        }

        if (!signups || signups.length === 0) {
            return (
                <p
                    style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "var(--text-secondary)",
                    }}
                >
                    No signups yet for this outing.
                </p>
            );
        }

        // Group all participants by type
        const allAdults: ParticipantResponse[] = [];
        const allScouts: ParticipantResponse[] = [];

        signups.forEach((signup) => {
            signup.participants.forEach((participant) => {
                if (participant.is_adult) {
                    allAdults.push(participant);
                } else {
                    allScouts.push(participant);
                }
            });
        });

        return (
            <div
                style={{
                    marginTop: "20px",
                    padding: "20px",
                    backgroundColor: "var(--bg-tertiary)",
                    borderRadius: "8px",
                }}
            >
                <h3
                    style={{
                        marginTop: 0,
                        marginBottom: "20px",
                        color: "var(--text-primary)",
                    }}
                >
                    Participant Details
                </h3>

                {allAdults.length > 0 && (
                    <div style={{ marginBottom: "30px" }}>
                        <h4
                            style={{
                                padding: "10px",
                                backgroundColor: "var(--color-primary)",
                                color: "var(--text-on-primary)",
                                borderRadius: "4px 4px 0 0",
                                margin: "0",
                            }}
                        >
                            Adults ({allAdults.length})
                        </h4>
                        {renderParticipantsTable(allAdults, true)}
                    </div>
                )}

                {allScouts.length > 0 && (
                    <div>
                        <h4
                            style={{
                                padding: "10px",
                                backgroundColor: "var(--color-accent)",
                                color: "var(--text-on-accent)",
                                borderRadius: "4px 4px 0 0",
                                margin: "0",
                            }}
                        >
                            Scouts ({allScouts.length})
                        </h4>
                        {renderParticipantsTable(allScouts, false)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
            <h2 style={{ color: "var(--text-primary)" }}>Outing Administrator</h2>

            {error && (
                <div
                    style={{
                        padding: "10px",
                        marginBottom: "20px",
                        backgroundColor: "var(--alert-error-bg)",
                        color: "var(--alert-error-text)",
                        borderRadius: "4px",
                        border: "1px solid var(--alert-error-border)",
                    }}
                >
                    {error}
                </div>
            )}

            <div
                style={{
                    marginBottom: "40px",
                    border: "1px solid var(--card-border)",
                    borderRadius: "8px",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "20px",
                        backgroundColor: "var(--bg-tertiary)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: isCreateOutingExpanded
                            ? "1px solid var(--card-border)"
                            : "none",
                    }}
                >
                    <div
                        onClick={() => setIsCreateOutingExpanded(!isCreateOutingExpanded)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setIsCreateOutingExpanded(!isCreateOutingExpanded);
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isCreateOutingExpanded}
                        style={{
                            cursor: "pointer",
                            flex: 1,
                            outline: "none",
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                color: "var(--text-primary)",
                                userSelect: "none",
                            }}
                        >
                            {isCreateOutingExpanded ? "▼" : "▶"} Create New Outing
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsWizardOpen(true)}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "var(--bsa-olive)",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "bold",
                            transition: "all 0.2s",
                            outline: "none",
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.backgroundColor =
                                "var(--bsa-olive-dark, #4a5320)";
                            e.currentTarget.style.transform = "scale(0.98)";
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--bsa-olive)";
                            e.currentTarget.style.transform = "scale(1)";
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "1";
                            e.currentTarget.style.backgroundColor = "var(--bsa-olive)";
                            e.currentTarget.style.transform = "scale(1)";
                        }}
                    >
                        ✨ Use Wizard (with AI Suggestions)
                    </button>
                </div>
                {isCreateOutingExpanded && (
                    <form onSubmit={handleCreateOuting} style={{ padding: "20px" }}>
                        <div style={{ marginBottom: "15px" }}>
                            <label
                                htmlFor="new-outing-name"
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "bold",
                                }}
                            >
                                Outing Name *
                            </label>
                            <input
                                id="new-outing-name"
                                type="text"
                                name="name"
                                value={newOuting.name}
                                onChange={handleInputChange}
                                placeholder="e.g., Summer Camp 2026"
                                required
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    fontSize: "14px",
                                    border: "1px solid var(--input-border)",
                                    borderRadius: "4px",
                                    backgroundColor: "var(--input-bg)",
                                    color: "var(--input-text)",
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: "15px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "bold",
                                }}
                            >
                                Outing Icon
                            </label>
                            <OutingIconPicker
                                value={newOuting.icon || ""}
                                onChange={handleIconChange}
                            />
                        </div>

                        <div style={{ marginBottom: "15px" }}>
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    marginBottom: "10px",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    name="is_overnight"
                                    checked={newOuting.is_overnight}
                                    onChange={handleInputChange}
                                    style={{ marginRight: "8px" }}
                                />
                                <span style={{ fontWeight: "bold" }}>Overnight Outing</span>
                            </label>
                        </div>

                        <div
                            style={{
                                marginBottom: "15px",
                                display: "grid",
                                gridTemplateColumns: newOuting.is_overnight
                                    ? "2fr 1fr 2fr"
                                    : "2fr 1fr 2fr",
                                gap: "15px",
                            }}
                        >
                            <div>
                                <label
                                    htmlFor="new-outing-date"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {newOuting.is_overnight ? "Start Date *" : "Outing Date *"}
                                </label>
                                <input
                                    id="new-outing-date"
                                    type="date"
                                    name="outing_date"
                                    value={newOuting.outing_date}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        fontSize: "14px",
                                        border: "1px solid var(--input-border)",
                                        borderRadius: "4px",
                                        backgroundColor: "var(--input-bg)",
                                        color: "var(--input-text)",
                                    }}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="new-outing-drop-off-time"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Drop-off Time
                                </label>
                                <input
                                    id="new-outing-drop-off-time"
                                    type="time"
                                    name="drop_off_time"
                                    value={newOuting.drop_off_time || ""}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        fontSize: "14px",
                                        border: "1px solid var(--input-border)",
                                        borderRadius: "4px",
                                        backgroundColor: "var(--input-bg)",
                                        color: "var(--input-text)",
                                    }}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="new-outing-drop-off-location"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Drop-off Location
                                </label>
                                <input
                                    id="new-outing-drop-off-location"
                                    type="text"
                                    name="drop_off_location"
                                    value={newOuting.drop_off_location || ""}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Troop Meeting Location"
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        fontSize: "14px",
                                        border: "1px solid var(--input-border)",
                                        borderRadius: "4px",
                                        backgroundColor: "var(--input-bg)",
                                        color: "var(--input-text)",
                                    }}
                                />
                            </div>
                        </div>

                        {newOuting.is_overnight && (
                            <div
                                style={{
                                    marginBottom: "15px",
                                    display: "grid",
                                    gridTemplateColumns: "2fr 1fr 2fr",
                                    gap: "15px",
                                }}
                            >
                                <div>
                                    <label
                                        htmlFor="new-outing-end-date"
                                        style={{
                                            display: "block",
                                            marginBottom: "5px",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        End Date *
                                    </label>
                                    <input
                                        id="new-outing-end-date"
                                        type="date"
                                        name="end_date"
                                        value={newOuting.end_date || ""}
                                        onChange={handleInputChange}
                                        required
                                        min={newOuting.outing_date}
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            fontSize: "14px",
                                            border: "1px solid var(--input-border)",
                                            borderRadius: "4px",
                                            backgroundColor: "var(--input-bg)",
                                            color: "var(--input-text)",
                                        }}
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="new-outing-pickup-time"
                                        style={{
                                            display: "block",
                                            marginBottom: "5px",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Pickup Time
                                    </label>
                                    <input
                                        id="new-outing-pickup-time"
                                        type="time"
                                        name="pickup_time"
                                        value={newOuting.pickup_time || ""}
                                        onChange={handleInputChange}
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            fontSize: "14px",
                                            border: "1px solid var(--input-border)",
                                            borderRadius: "4px",
                                            backgroundColor: "var(--input-bg)",
                                            color: "var(--input-text)",
                                        }}
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="new-outing-pickup-location"
                                        style={{
                                            display: "block",
                                            marginBottom: "5px",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Pickup Location
                                    </label>
                                    <input
                                        id="new-outing-pickup-location"
                                        type="text"
                                        name="pickup_location"
                                        value={newOuting.pickup_location || ""}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Troop Meeting Location"
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            fontSize: "14px",
                                            border: "1px solid var(--input-border)",
                                            borderRadius: "4px",
                                            backgroundColor: "var(--input-bg)",
                                            color: "var(--input-text)",
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: "15px" }}>
                            <label
                                htmlFor="new-outing-location"
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "bold",
                                }}
                            >
                                Location * (Short Name)
                            </label>
                            <input
                                id="new-outing-location"
                                type="text"
                                name="location"
                                value={newOuting.location}
                                onChange={handleInputChange}
                                placeholder="e.g., Camp Wilderness"
                                required
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    fontSize: "14px",
                                    border: "1px solid var(--input-border)",
                                    borderRadius: "4px",
                                    backgroundColor: "var(--input-bg)",
                                    color: "var(--input-text)",
                                }}
                            />
                        </div>

                        <div style={{ display: "grid", gap: "15px", marginBottom: "20px" }}>
                            <PlacePicker
                                label="Outing Address"
                                value={outingAddress}
                                onChange={setOutingAddress}
                                helperText="Full address or saved place for outing destination"
                            />
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "15px",
                                }}
                            >
                                <PlacePicker
                                    label="Pickup Location"
                                    value={pickupAddress}
                                    onChange={setPickupAddress}
                                    helperText="Where participants meet before departure"
                                />
                                <PlacePicker
                                    label="Drop-off Location"
                                    value={dropoffAddress}
                                    onChange={setDropoffAddress}
                                    helperText="Where participants return after outing"
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: "15px" }}>
                            <label
                                htmlFor="new-outing-description"
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "bold",
                                }}
                            >
                                Description
                            </label>
                            <textarea
                                id="new-outing-description"
                                name="description"
                                value={newOuting.description}
                                onChange={handleInputChange}
                                placeholder="Outing details and activities..."
                                rows={4}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    fontSize: "14px",
                                    border: "1px solid var(--input-border)",
                                    borderRadius: "4px",
                                    backgroundColor: "var(--input-bg)",
                                    color: "var(--input-text)",
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: "15px" }}>
                            <label
                                htmlFor="new-outing-capacity-type"
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "bold",
                                }}
                            >
                                Capacity Type *
                            </label>
                            <select
                                id="new-outing-capacity-type"
                                name="capacity_type"
                                value={newOuting.capacity_type}
                                onChange={handleInputChange}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    fontSize: "14px",
                                    border: "1px solid var(--input-border)",
                                    borderRadius: "4px",
                                    backgroundColor: "var(--input-bg)",
                                    color: "var(--input-text)",
                                }}
                            >
                                <option value="fixed">Fixed Capacity</option>
                                <option value="vehicle">Vehicle-Based Capacity</option>
                            </select>
                            <p
                                style={{
                                    fontSize: "12px",
                                    color: "var(--text-secondary)",
                                    marginTop: "5px",
                                }}
                            >
                                {newOuting.capacity_type === "fixed"
                                    ? "Set a fixed maximum number of participants"
                                    : "Capacity based on available vehicle seats from adults"}
                            </p>
                        </div>

                        {newOuting.capacity_type === "fixed" && (
                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    htmlFor="new-outing-max-participants"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Maximum Capacity *
                                </label>
                                <input
                                    id="new-outing-max-participants"
                                    type="number"
                                    name="max_participants"
                                    value={newOuting.max_participants}
                                    onChange={handleInputChange}
                                    min="1"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        fontSize: "14px",
                                        border: "1px solid var(--input-border)",
                                        borderRadius: "4px",
                                        backgroundColor: "var(--input-bg)",
                                        color: "var(--input-text)",
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ marginBottom: "15px" }}>
                            <label
                                htmlFor="new-outing-cost"
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "bold",
                                }}
                            >
                                Cost (USD)
                            </label>
                            <input
                                id="new-outing-cost"
                                type="number"
                                name="cost"
                                value={newOuting.cost ?? ""}
                                onChange={handleInputChange}
                                min="0"
                                step="0.01"
                                placeholder="e.g., 25.00"
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    fontSize: "14px",
                                    border: "1px solid var(--input-border)",
                                    borderRadius: "4px",
                                    backgroundColor: "var(--input-bg)",
                                    color: "var(--input-text)",
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: "15px" }}>
                            <label
                                htmlFor="new-outing-gear-list"
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "bold",
                                }}
                            >
                                Suggested Gear List
                            </label>
                            <textarea
                                id="new-outing-gear-list"
                                name="gear_list"
                                value={newOuting.gear_list || ""}
                                onChange={handleInputChange}
                                placeholder="e.g., Sleeping bag, tent, flashlight, water bottle..."
                                rows={4}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    fontSize: "14px",
                                    border: "1px solid var(--input-border)",
                                    borderRadius: "4px",
                                    backgroundColor: "var(--input-bg)",
                                    color: "var(--input-text)",
                                }}
                            />
                        </div>

                        <div
                            style={{
                                marginBottom: "20px",
                                padding: "15px",
                                backgroundColor: "var(--bg-tertiary)",
                                borderRadius: "4px",
                            }}
                        >
                            <h3 style={{ marginTop: 0, marginBottom: "15px" }}>
                                Outing Lead Contact Information (Optional)
                            </h3>

                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    htmlFor="new-outing-lead-name"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Outing Lead Name
                                </label>
                                <input
                                    id="new-outing-lead-name"
                                    type="text"
                                    name="outing_lead_name"
                                    value={newOuting.outing_lead_name || ""}
                                    onChange={handleInputChange}
                                    placeholder="e.g., John Smith"
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        fontSize: "14px",
                                        border: "1px solid var(--input-border)",
                                        borderRadius: "4px",
                                        backgroundColor: "var(--input-bg)",
                                        color: "var(--input-text)",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    htmlFor="new-outing-lead-email"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Outing Lead Email
                                </label>
                                <input
                                    id="new-outing-lead-email"
                                    type="email"
                                    name="outing_lead_email"
                                    value={newOuting.outing_lead_email || ""}
                                    onChange={handleInputChange}
                                    placeholder="e.g., john.smith@example.com"
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        fontSize: "14px",
                                        border: "1px solid var(--input-border)",
                                        borderRadius: "4px",
                                        backgroundColor: "var(--input-bg)",
                                        color: "var(--input-text)",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    htmlFor="new-outing-lead-phone"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Outing Lead Phone
                                </label>
                                <input
                                    id="new-outing-lead-phone"
                                    type="tel"
                                    name="outing_lead_phone"
                                    value={newOuting.outing_lead_phone || ""}
                                    onChange={handleInputChange}
                                    placeholder="(555) 123-4567"
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        fontSize: "14px",
                                        border: "1px solid var(--input-border)",
                                        borderRadius: "4px",
                                        backgroundColor: "var(--input-bg)",
                                        color: "var(--input-text)",
                                    }}
                                />
                                <p
                                    style={{
                                        fontSize: "12px",
                                        color: "var(--text-secondary)",
                                        marginTop: "4px",
                                        marginBottom: "0",
                                    }}
                                >
                                    Format: (XXX) XXX-XXXX
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "var(--btn-primary-bg)",
                                color: "var(--btn-primary-text)",
                                border: "none",
                                borderRadius: "4px",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontSize: "16px",
                            }}
                        >
                            {loading ? "Creating..." : "Create Outing"}
                        </button>
                    </form>
                )}
            </div>

            <div>
                <h3 style={{ color: "var(--text-primary)" }}>
                    Current Outings ({outings.length})
                </h3>
                {loading && outings.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>Loading outings...</p>
                ) : outings.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>
                        No outings created yet. Create your first outing above!
                    </p>
                ) : (
                    <div style={{ display: "grid", gap: "20px" }}>
                        {outings.map((outing) => (
                            <div
                                key={outing.id}
                                style={{
                                    border: "1px solid var(--card-border)",
                                    borderRadius: "8px",
                                    backgroundColor: "var(--bg-tertiary)",
                                    overflow: "hidden",
                                }}
                            >
                                {editingOutingId === outing.id && editOuting ? (
                                    <div style={{ backgroundColor: "var(--alert-warning-bg)" }}>
                                        <div
                                            style={{
                                                padding: "20px",
                                                borderBottom: "1px solid var(--card-border)",
                                                backgroundColor: "var(--bg-secondary)",
                                                color: "var(--text-primary)",
                                            }}
                                        >
                                            <h3 style={{ margin: 0 }}>✏️ Editing: {outing.name}</h3>
                                        </div>
                                        <form
                                            onSubmit={handleUpdateOuting}
                                            style={{ padding: "20px" }}
                                        >
                                            <div style={{ marginBottom: "15px" }}>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "5px",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    Outing Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={editOuting.name}
                                                    onChange={handleEditInputChange}
                                                    required
                                                    style={{
                                                        width: "100%",
                                                        padding: "8px",
                                                        fontSize: "14px",
                                                        border: "1px solid var(--input-border)",
                                                        borderRadius: "4px",
                                                        backgroundColor: "var(--input-bg)",
                                                        color: "var(--input-text)",
                                                    }}
                                                />
                                            </div>

                                            <div style={{ marginBottom: "15px" }}>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "5px",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    Outing Icon
                                                </label>
                                                <OutingIconPicker
                                                    value={editOuting.icon || ""}
                                                    onChange={(icon) =>
                                                        setEditOuting({ ...editOuting, icon })
                                                    }
                                                />
                                            </div>

                                            <div style={{ marginBottom: "15px" }}>
                                                <label
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="is_overnight"
                                                        checked={editOuting.is_overnight}
                                                        onChange={handleEditInputChange}
                                                        style={{ marginRight: "8px" }}
                                                    />
                                                    <span style={{ fontWeight: "bold" }}>
                                                        Overnight Outing
                                                    </span>
                                                </label>
                                            </div>

                                            <div
                                                style={{
                                                    marginBottom: "15px",
                                                    display: "grid",
                                                    gridTemplateColumns: editOuting.is_overnight
                                                        ? "2fr 1fr 2fr"
                                                        : "2fr 1fr 2fr",
                                                    gap: "15px",
                                                }}
                                            >
                                                <div>
                                                    <label
                                                        style={{
                                                            display: "block",
                                                            marginBottom: "5px",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        {editOuting.is_overnight
                                                            ? "Start Date *"
                                                            : "Outing Date *"}
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="outing_date"
                                                        value={editOuting.outing_date}
                                                        onChange={handleEditInputChange}
                                                        required
                                                        style={{
                                                            width: "100%",
                                                            padding: "8px",
                                                            fontSize: "14px",
                                                            border: "1px solid var(--input-border)",
                                                            borderRadius: "4px",
                                                            backgroundColor: "var(--input-bg)",
                                                            color: "var(--input-text)",
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        style={{
                                                            display: "block",
                                                            marginBottom: "5px",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        Drop-off Time
                                                    </label>
                                                    <input
                                                        type="time"
                                                        name="drop_off_time"
                                                        value={editOuting.drop_off_time || ""}
                                                        onChange={handleEditInputChange}
                                                        style={{
                                                            width: "100%",
                                                            padding: "8px",
                                                            fontSize: "14px",
                                                            border: "1px solid var(--input-border)",
                                                            borderRadius: "4px",
                                                            backgroundColor: "var(--input-bg)",
                                                            color: "var(--input-text)",
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        style={{
                                                            display: "block",
                                                            marginBottom: "5px",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        Drop-off Location
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="drop_off_location"
                                                        value={editOuting.drop_off_location || ""}
                                                        onChange={handleEditInputChange}
                                                        placeholder="e.g., Troop Meeting Location"
                                                        style={{
                                                            width: "100%",
                                                            padding: "8px",
                                                            fontSize: "14px",
                                                            border: "1px solid var(--input-border)",
                                                            borderRadius: "4px",
                                                            backgroundColor: "var(--input-bg)",
                                                            color: "var(--input-text)",
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {editOuting.is_overnight && (
                                                <div
                                                    style={{
                                                        marginBottom: "15px",
                                                        display: "grid",
                                                        gridTemplateColumns: "2fr 1fr 2fr",
                                                        gap: "15px",
                                                    }}
                                                >
                                                    <div>
                                                        <label
                                                            style={{
                                                                display: "block",
                                                                marginBottom: "5px",
                                                                fontWeight: "bold",
                                                            }}
                                                        >
                                                            End Date *
                                                        </label>
                                                        <input
                                                            type="date"
                                                            name="end_date"
                                                            value={editOuting.end_date || ""}
                                                            onChange={handleEditInputChange}
                                                            required
                                                            min={editOuting.outing_date}
                                                            style={{
                                                                width: "100%",
                                                                padding: "8px",
                                                                fontSize: "14px",
                                                                border: "1px solid var(--input-border)",
                                                                borderRadius: "4px",
                                                                backgroundColor: "var(--input-bg)",
                                                                color: "var(--input-text)",
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            style={{
                                                                display: "block",
                                                                marginBottom: "5px",
                                                                fontWeight: "bold",
                                                            }}
                                                        >
                                                            Pickup Time
                                                        </label>
                                                        <input
                                                            type="time"
                                                            name="pickup_time"
                                                            value={editOuting.pickup_time || ""}
                                                            onChange={handleEditInputChange}
                                                            style={{
                                                                width: "100%",
                                                                padding: "8px",
                                                                fontSize: "14px",
                                                                border: "1px solid var(--input-border)",
                                                                borderRadius: "4px",
                                                                backgroundColor: "var(--input-bg)",
                                                                color: "var(--input-text)",
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            style={{
                                                                display: "block",
                                                                marginBottom: "5px",
                                                                fontWeight: "bold",
                                                            }}
                                                        >
                                                            Pickup Location
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="pickup_location"
                                                            value={editOuting.pickup_location || ""}
                                                            onChange={handleEditInputChange}
                                                            placeholder="e.g., Troop Meeting Location"
                                                            style={{
                                                                width: "100%",
                                                                padding: "8px",
                                                                fontSize: "14px",
                                                                border: "1px solid var(--input-border)",
                                                                borderRadius: "4px",
                                                                backgroundColor: "var(--input-bg)",
                                                                color: "var(--input-text)",
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ marginBottom: "15px" }}>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "5px",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    Location *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={editOuting.location}
                                                    onChange={handleEditInputChange}
                                                    required
                                                    style={{
                                                        width: "100%",
                                                        padding: "8px",
                                                        fontSize: "14px",
                                                        border: "1px solid var(--input-border)",
                                                        borderRadius: "4px",
                                                        backgroundColor: "var(--input-bg)",
                                                        color: "var(--input-text)",
                                                    }}
                                                />
                                            </div>

                                            <div style={{ marginBottom: "15px" }}>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "5px",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    Description
                                                </label>
                                                <textarea
                                                    name="description"
                                                    value={editOuting.description}
                                                    onChange={handleEditInputChange}
                                                    rows={4}
                                                    style={{
                                                        width: "100%",
                                                        padding: "8px",
                                                        fontSize: "14px",
                                                        border: "1px solid var(--input-border)",
                                                        borderRadius: "4px",
                                                        backgroundColor: "var(--input-bg)",
                                                        color: "var(--input-text)",
                                                    }}
                                                />
                                            </div>

                                            <div style={{ marginBottom: "15px" }}>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "5px",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    Capacity Type *
                                                </label>
                                                <select
                                                    name="capacity_type"
                                                    value={editOuting.capacity_type}
                                                    onChange={handleEditInputChange}
                                                    style={{
                                                        width: "100%",
                                                        padding: "8px",
                                                        fontSize: "14px",
                                                        border: "1px solid var(--input-border)",
                                                        borderRadius: "4px",
                                                        backgroundColor: "var(--input-bg)",
                                                        color: "var(--input-text)",
                                                    }}
                                                >
                                                    <option value="fixed">Fixed Capacity</option>
                                                    <option value="vehicle">
                                                        Vehicle-Based Capacity
                                                    </option>
                                                </select>
                                            </div>

                                            {editOuting.capacity_type === "fixed" && (
                                                <div style={{ marginBottom: "15px" }}>
                                                    <label
                                                        style={{
                                                            display: "block",
                                                            marginBottom: "5px",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        Maximum Capacity *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="max_participants"
                                                        value={editOuting.max_participants}
                                                        onChange={handleEditInputChange}
                                                        min="1"
                                                        required
                                                        style={{
                                                            width: "100%",
                                                            padding: "8px",
                                                            fontSize: "14px",
                                                            border: "1px solid var(--input-border)",
                                                            borderRadius: "4px",
                                                            backgroundColor: "var(--input-bg)",
                                                            color: "var(--input-text)",
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <div style={{ marginBottom: "15px" }}>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "5px",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    Cost (USD)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="cost"
                                                    value={editOuting.cost ?? ""}
                                                    onChange={handleEditInputChange}
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="e.g., 25.00"
                                                    style={{
                                                        width: "100%",
                                                        padding: "8px",
                                                        fontSize: "14px",
                                                        border: "1px solid var(--input-border)",
                                                        borderRadius: "4px",
                                                        backgroundColor: "var(--input-bg)",
                                                        color: "var(--input-text)",
                                                    }}
                                                />
                                            </div>

                                            <div style={{ marginBottom: "15px" }}>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "5px",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    Suggested Gear List
                                                </label>
                                                <textarea
                                                    name="gear_list"
                                                    value={editOuting.gear_list || ""}
                                                    onChange={handleEditInputChange}
                                                    placeholder="e.g., Sleeping bag, tent, flashlight, water bottle..."
                                                    rows={4}
                                                    style={{
                                                        width: "100%",
                                                        padding: "8px",
                                                        fontSize: "14px",
                                                        border: "1px solid var(--input-border)",
                                                        borderRadius: "4px",
                                                        backgroundColor: "var(--input-bg)",
                                                        color: "var(--input-text)",
                                                    }}
                                                />
                                            </div>

                                            <div
                                                style={{
                                                    marginBottom: "20px",
                                                    padding: "15px",
                                                    backgroundColor: "var(--bg-tertiary)",
                                                    borderRadius: "4px",
                                                }}
                                            >
                                                <h3 style={{ marginTop: 0, marginBottom: "15px" }}>
                                                    Outing Lead Contact (Optional)
                                                </h3>

                                                <div style={{ marginBottom: "15px" }}>
                                                    <label
                                                        style={{
                                                            display: "block",
                                                            marginBottom: "5px",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        Outing Lead Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="outing_lead_name"
                                                        value={editOuting.outing_lead_name || ""}
                                                        onChange={handleEditInputChange}
                                                        style={{
                                                            width: "100%",
                                                            padding: "8px",
                                                            fontSize: "14px",
                                                            border: "1px solid var(--input-border)",
                                                            borderRadius: "4px",
                                                            backgroundColor: "var(--input-bg)",
                                                            color: "var(--input-text)",
                                                        }}
                                                    />
                                                </div>

                                                <div style={{ marginBottom: "15px" }}>
                                                    <label
                                                        style={{
                                                            display: "block",
                                                            marginBottom: "5px",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        Outing Lead Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="outing_lead_email"
                                                        value={editOuting.outing_lead_email || ""}
                                                        onChange={handleEditInputChange}
                                                        style={{
                                                            width: "100%",
                                                            padding: "8px",
                                                            fontSize: "14px",
                                                            border: "1px solid var(--input-border)",
                                                            borderRadius: "4px",
                                                            backgroundColor: "var(--input-bg)",
                                                            color: "var(--input-text)",
                                                        }}
                                                    />
                                                </div>

                                                <div style={{ marginBottom: "15px" }}>
                                                    <label
                                                        style={{
                                                            display: "block",
                                                            marginBottom: "5px",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        Outing Lead Phone
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="outing_lead_phone"
                                                        value={editOuting.outing_lead_phone || ""}
                                                        onChange={handleEditInputChange}
                                                        placeholder="(555) 123-4567"
                                                        style={{
                                                            width: "100%",
                                                            padding: "8px",
                                                            fontSize: "14px",
                                                            border: "1px solid var(--input-border)",
                                                            borderRadius: "4px",
                                                            backgroundColor: "var(--input-bg)",
                                                            color: "var(--input-text)",
                                                        }}
                                                    />
                                                    <p
                                                        style={{
                                                            fontSize: "12px",
                                                            color: "var(--text-secondary)",
                                                            marginTop: "4px",
                                                            marginBottom: "0",
                                                        }}
                                                    >
                                                        Format: (XXX) XXX-XXXX
                                                    </p>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", gap: "10px" }}>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    style={{
                                                        padding: "10px 20px",
                                                        backgroundColor: "var(--btn-primary-bg)",
                                                        color: "var(--btn-primary-text)",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        cursor: loading ? "not-allowed" : "pointer",
                                                        fontSize: "16px",
                                                    }}
                                                >
                                                    {loading ? "Updating..." : "Update Outing"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    disabled={loading}
                                                    style={{
                                                        padding: "10px 20px",
                                                        backgroundColor: "var(--btn-secondary-bg)",
                                                        color: "var(--btn-secondary-text)",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        cursor: loading ? "not-allowed" : "pointer",
                                                        fontSize: "16px",
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            onClick={() => handleOutingClick(outing.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    handleOutingClick(outing.id);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            aria-expanded={expandedOutingId === outing.id}
                                            style={{
                                                padding: "20px",
                                                backgroundColor:
                                                    expandedOutingId === outing.id
                                                        ? "var(--bg-primary)"
                                                        : "var(--bg-tertiary)",
                                                transition: "background-color 0.2s",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "start",
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            gap: "12px",
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <h3
                                                            style={{
                                                                margin: 0,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 8,
                                                                fontSize: "18px",
                                                                flex: "1 1 auto",
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            {expandedOutingId === outing.id ? "▼" : "▶"}
                                                            <OutingIconDisplay icon={outing.icon} />
                                                            <span
                                                                style={{
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                            >
                                                                {outing.name}
                                                            </span>
                                                        </h3>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "8px",
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontSize: "14px",
                                                                    fontWeight: "600",
                                                                    color: "var(--text-secondary)",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                            >
                                                                📅 {formatOutingDate(outing.outing_date)}
                                                                {outing.is_overnight &&
                                                                    outing.end_date &&
                                                                    ` - ${formatOutingDate(outing.end_date)}`}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    padding: "4px 10px",
                                                                    borderRadius: "4px",
                                                                    fontSize: "13px",
                                                                    fontWeight: "600",
                                                                    backgroundColor: outing.is_full
                                                                        ? "var(--alert-error-bg)"
                                                                        : "var(--alert-success-bg)",
                                                                    color: outing.is_full
                                                                        ? "var(--alert-error-text)"
                                                                        : "var(--alert-success-text)",
                                                                    border: `1px solid ${outing.is_full
                                                                        ? "var(--alert-error-border)"
                                                                        : "var(--alert-success-border)"
                                                                        }`,
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                            >
                                                                {outing.signup_count} /{" "}
                                                                {outing.capacity_type === "fixed"
                                                                    ? outing.max_participants
                                                                    : outing.total_vehicle_capacity}
                                                                {outing.is_full && " 🔴"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {/* Collapsible Details Section */}
                                                    <div
                                                        style={{
                                                            margin: "10px 0",
                                                            border: "1px solid var(--card-border)",
                                                            borderRadius: "8px",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        <div
                                                            onClick={() => {
                                                                const newState = { ...collapsedLogistics };
                                                                newState[`details-${outing.id}`] =
                                                                    !newState[`details-${outing.id}`];
                                                                setCollapsedLogistics(newState);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter" || e.key === " ") {
                                                                    e.preventDefault();
                                                                    const newState = { ...collapsedLogistics };
                                                                    newState[`details-${outing.id}`] =
                                                                        !newState[`details-${outing.id}`];
                                                                    setCollapsedLogistics(newState);
                                                                }
                                                            }}
                                                            role="button"
                                                            tabIndex={0}
                                                            aria-expanded={
                                                                collapsedLogistics[`details-${outing.id}`] ===
                                                                false
                                                            }
                                                            style={{
                                                                padding: "12px 15px",
                                                                cursor: "pointer",
                                                                backgroundColor: "var(--bg-tertiary)",
                                                                transition: "background-color 0.2s",
                                                                borderBottom:
                                                                    collapsedLogistics[`details-${outing.id}`] ===
                                                                        false
                                                                        ? "1px solid var(--card-border)"
                                                                        : "none",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "8px",
                                                            }}
                                                        >
                                                            <span style={{ fontSize: "14px" }}>
                                                                {collapsedLogistics[`details-${outing.id}`] ===
                                                                    false
                                                                    ? "▼"
                                                                    : "▶"}
                                                            </span>
                                                            <span style={{ fontSize: "16px" }}>📋</span>
                                                            <strong style={{ fontSize: "15px" }}>
                                                                Details
                                                            </strong>
                                                        </div>
                                                        {collapsedLogistics[`details-${outing.id}`] ===
                                                            false && (
                                                                <div style={{ padding: "12px" }}>
                                                                    <p style={{ margin: "5px 0" }}>
                                                                        <strong>Location:</strong> {outing.location}
                                                                    </p>
                                                                    {outing.description && (
                                                                        <p style={{ margin: "5px 0" }}>
                                                                            <strong>Description:</strong>{" "}
                                                                            {outing.description}
                                                                        </p>
                                                                    )}

                                                                    {/* Driver warning for vehicle-based capacity */}
                                                                    {outing.capacity_type === "vehicle" &&
                                                                        outing.needs_more_drivers && (
                                                                            <p
                                                                                style={{
                                                                                    color: "var(--alert-warning-text)",
                                                                                    fontWeight: "bold",
                                                                                    padding: "8px",
                                                                                    backgroundColor:
                                                                                        "var(--alert-warning-bg)",
                                                                                    borderRadius: "4px",
                                                                                    marginTop: "10px",
                                                                                    border:
                                                                                        "1px solid var(--alert-warning-border)",
                                                                                }}
                                                                            >
                                                                                ⚠️ More drivers needed! Current vehicle
                                                                                capacity ({outing.total_vehicle_capacity})
                                                                                is less than participants (
                                                                                {outing.signup_count})
                                                                            </p>
                                                                        )}

                                                                    {/* Cost */}
                                                                    {outing.cost && (
                                                                        <p style={{ margin: "10px 0 5px 0" }}>
                                                                            <strong>Cost:</strong> $
                                                                            {typeof outing.cost === "number"
                                                                                ? outing.cost.toFixed(2)
                                                                                : parseFloat(outing.cost as any).toFixed(
                                                                                    2
                                                                                )}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>

                                                    {/* Collapsible Logistics Information */}
                                                    {(outing.drop_off_time ||
                                                        outing.drop_off_location ||
                                                        outing.pickup_time ||
                                                        outing.pickup_location) && (
                                                            <div style={{ margin: "10px 0" }}>
                                                                <div
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setCollapsedLogistics((prev) => ({
                                                                            ...prev,
                                                                            [outing.id]:
                                                                                prev[outing.id] === false ? true : false,
                                                                        }));
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter" || e.key === " ") {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setCollapsedLogistics((prev) => ({
                                                                                ...prev,
                                                                                [outing.id]:
                                                                                    prev[outing.id] === false
                                                                                        ? true
                                                                                        : false,
                                                                            }));
                                                                        }
                                                                    }}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    aria-expanded={
                                                                        collapsedLogistics[outing.id] !== false
                                                                    }
                                                                    style={{
                                                                        padding: "10px",
                                                                        backgroundColor: "var(--bg-secondary)",
                                                                        borderRadius: "4px",
                                                                        border: "1px solid var(--card-border)",
                                                                        cursor: "pointer",
                                                                        userSelect: "none",
                                                                    }}
                                                                >
                                                                    <p
                                                                        style={{
                                                                            margin: "0",
                                                                            fontWeight: "bold",
                                                                            color: "var(--text-primary)",
                                                                        }}
                                                                    >
                                                                        {collapsedLogistics[outing.id] === false
                                                                            ? "▼"
                                                                            : "▶"}{" "}
                                                                        📍 Logistics
                                                                    </p>
                                                                </div>
                                                                {collapsedLogistics[outing.id] === false && (
                                                                    <div
                                                                        style={{
                                                                            padding: "10px",
                                                                            backgroundColor: "var(--bg-secondary)",
                                                                            borderRadius: "0 0 4px 4px",
                                                                            border: "1px solid var(--card-border)",
                                                                            borderTop: "none",
                                                                        }}
                                                                    >
                                                                        {(outing.drop_off_time ||
                                                                            outing.drop_off_location) && (
                                                                                <p
                                                                                    style={{
                                                                                        margin: "5px 0 5px 10px",
                                                                                        fontSize: "14px",
                                                                                    }}
                                                                                >
                                                                                    <strong>Drop-off:</strong>{" "}
                                                                                    {outing.drop_off_time &&
                                                                                        `${outing.drop_off_time}`}
                                                                                    {outing.drop_off_time &&
                                                                                        outing.drop_off_location &&
                                                                                        " at "}
                                                                                    {outing.drop_off_location}
                                                                                </p>
                                                                            )}
                                                                        {(outing.pickup_time ||
                                                                            outing.pickup_location) && (
                                                                                <p
                                                                                    style={{
                                                                                        margin: "5px 0 5px 10px",
                                                                                        fontSize: "14px",
                                                                                    }}
                                                                                >
                                                                                    <strong>Pickup:</strong>{" "}
                                                                                    {outing.pickup_time &&
                                                                                        `${outing.pickup_time}`}
                                                                                    {outing.pickup_time &&
                                                                                        outing.pickup_location &&
                                                                                        " at "}
                                                                                    {outing.pickup_location}
                                                                                </p>
                                                                            )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                    {/* Collapsible Suggested Gear */}
                                                    {outing.gear_list && (
                                                        <div style={{ margin: "10px 0" }}>
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCollapsedGear((prev) => ({
                                                                        ...prev,
                                                                        [outing.id]:
                                                                            prev[outing.id] === false ? true : false,
                                                                    }));
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter" || e.key === " ") {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setCollapsedGear((prev) => ({
                                                                            ...prev,
                                                                            [outing.id]:
                                                                                prev[outing.id] === false
                                                                                    ? true
                                                                                    : false,
                                                                        }));
                                                                    }
                                                                }}
                                                                role="button"
                                                                tabIndex={0}
                                                                aria-expanded={
                                                                    collapsedGear[outing.id] !== false
                                                                }
                                                                style={{
                                                                    padding: "10px",
                                                                    backgroundColor: "var(--bg-secondary)",
                                                                    borderRadius: "4px",
                                                                    border: "1px solid var(--card-border)",
                                                                    cursor: "pointer",
                                                                    userSelect: "none",
                                                                }}
                                                            >
                                                                <p
                                                                    style={{
                                                                        margin: "0",
                                                                        fontWeight: "bold",
                                                                        color: "var(--text-primary)",
                                                                    }}
                                                                >
                                                                    {collapsedGear[outing.id] === false
                                                                        ? "▼"
                                                                        : "▶"}{" "}
                                                                    🎒 Suggested Gear
                                                                </p>
                                                            </div>
                                                            {collapsedGear[outing.id] === false && (
                                                                <div
                                                                    style={{
                                                                        padding: "10px",
                                                                        backgroundColor: "var(--bg-secondary)",
                                                                        borderRadius: "0 0 4px 4px",
                                                                        border: "1px solid var(--card-border)",
                                                                        borderTop: "none",
                                                                    }}
                                                                >
                                                                    <p
                                                                        style={{
                                                                            margin: "5px 0",
                                                                            fontSize: "14px",
                                                                            whiteSpace: "pre-wrap",
                                                                        }}
                                                                    >
                                                                        {outing.gear_list}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {expandedOutingId === outing.id &&
                                            renderOutingSignups(outing.id)}

                                        {/* Actions Section - Collapsible */}
                                        <div
                                            style={{
                                                backgroundColor: "var(--card-bg)",
                                                borderTop: "1px solid var(--card-border)",
                                            }}
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCollapsedActions({
                                                        ...collapsedActions,
                                                        [outing.id]: !collapsedActions[outing.id],
                                                    });
                                                }}
                                                style={{
                                                    width: "100%",
                                                    padding: "14px 20px",
                                                    backgroundColor: "var(--bg-tertiary)",
                                                    color: "var(--text-primary)",
                                                    border: "none",
                                                    borderRadius: "0",
                                                    cursor: "pointer",
                                                    fontSize: "16px",
                                                    fontWeight: "bold",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    transition: "background-color 0.2s",
                                                }}
                                                onMouseEnter={(e) =>
                                                (e.currentTarget.style.backgroundColor =
                                                    "var(--bg-secondary)")
                                                }
                                                onMouseLeave={(e) =>
                                                (e.currentTarget.style.backgroundColor =
                                                    "var(--bg-tertiary)")
                                                }
                                            >
                                                <span style={{ fontSize: "18px" }}>⚙️ Actions</span>
                                                <span style={{ fontSize: "12px" }}>
                                                    {collapsedActions[outing.id] ? "▶" : "▼"}
                                                </span>
                                            </button>
                                            {!collapsedActions[outing.id] && (
                                                <div
                                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
                                                    style={{ padding: "15px 20px" }}
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleShowQRCode(outing.id, outing.name);
                                                        }}
                                                        disabled={loading}
                                                        className="w-full !py-2 !px-4"
                                                        style={{
                                                            backgroundColor: "var(--btn-info-bg)",
                                                            color: "var(--btn-info-text)",
                                                            borderRadius: "4px",
                                                            cursor: loading ? "not-allowed" : "pointer",
                                                        }}
                                                        title="Show QR code for easy sharing"
                                                    >
                                                        📱 QR Code
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleShowEmailModal(outing);
                                                        }}
                                                        disabled={loading || outing.signup_count === 0}
                                                        className="w-full !py-2 !px-4"
                                                        style={{
                                                            backgroundColor:
                                                                outing.signup_count === 0
                                                                    ? "var(--btn-disabled-bg)"
                                                                    : "var(--btn-success-bg)",
                                                            color:
                                                                outing.signup_count === 0
                                                                    ? "var(--btn-disabled-text)"
                                                                    : "var(--btn-success-text)",
                                                            borderRadius: "4px",
                                                            cursor:
                                                                loading || outing.signup_count === 0
                                                                    ? "not-allowed"
                                                                    : "pointer",
                                                        }}
                                                        title={
                                                            outing.signup_count === 0
                                                                ? "No signups yet"
                                                                : "Email all participants"
                                                        }
                                                    >
                                                        📧 Email Participants
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleExportRosterPDF(outing.id, outing.name);
                                                        }}
                                                        disabled={loading || outing.signup_count === 0}
                                                        className="w-full !py-2 !px-4"
                                                        style={{
                                                            backgroundColor:
                                                                outing.signup_count === 0
                                                                    ? "var(--btn-disabled-bg)"
                                                                    : "var(--btn-secondary-bg)",
                                                            color:
                                                                outing.signup_count === 0
                                                                    ? "var(--btn-disabled-text)"
                                                                    : "var(--btn-secondary-text)",
                                                            borderRadius: "4px",
                                                            cursor:
                                                                loading || outing.signup_count === 0
                                                                    ? "not-allowed"
                                                                    : "pointer",
                                                        }}
                                                        title={
                                                            outing.signup_count === 0
                                                                ? "No participants to export"
                                                                : "Download printable PDF roster with checkboxes for check-in"
                                                        }
                                                    >
                                                        📄 Export Roster
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownloadHandout(outing.id, outing.name);
                                                        }}
                                                        disabled={loading}
                                                        className="w-full !py-2 !px-4"
                                                        style={{
                                                            backgroundColor: "var(--btn-secondary-bg)",
                                                            color: "var(--btn-secondary-text)",
                                                            borderRadius: "4px",
                                                            cursor: loading ? "not-allowed" : "pointer",
                                                            marginTop: "8px",
                                                        }}
                                                        title="Download printable handout with 5Ws and packing list"
                                                    >
                                                        📋 Trip Handout
                                                    </button>
                                                    <Link
                                                        to={`/check-in/${outing.id}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="btn w-full text-center !py-2 !px-4"
                                                        style={{
                                                            backgroundColor:
                                                                outing.signup_count === 0
                                                                    ? "var(--btn-disabled-bg)"
                                                                    : "var(--btn-primary-bg)",
                                                            color:
                                                                outing.signup_count === 0
                                                                    ? "var(--btn-disabled-text)"
                                                                    : "var(--btn-primary-text)",
                                                            borderRadius: "4px",
                                                            cursor:
                                                                outing.signup_count === 0
                                                                    ? "not-allowed"
                                                                    : "pointer",
                                                            textDecoration: "none",
                                                            pointerEvents:
                                                                outing.signup_count === 0 ? "none" : "auto",
                                                            opacity: outing.signup_count === 0 ? 0.6 : 1,
                                                            fontSize: "16px",
                                                        }}
                                                        title={
                                                            outing.signup_count === 0
                                                                ? "No participants to check in"
                                                                : "Open check-in mode for this outing"
                                                        }
                                                    >
                                                        📋 Check-in
                                                    </Link>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditOuting(outing);
                                                        }}
                                                        disabled={loading}
                                                        className="w-full !py-2 !px-4"
                                                        style={{
                                                            backgroundColor: "var(--btn-secondary-bg)",
                                                            color: "var(--btn-secondary-text)",
                                                            borderRadius: "4px",
                                                            cursor: loading ? "not-allowed" : "pointer",
                                                        }}
                                                    >
                                                        ✏️ Edit Outing
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteOuting(outing.id);
                                                        }}
                                                        disabled={loading}
                                                        className="w-full !py-2 !px-4"
                                                        style={{
                                                            backgroundColor: "var(--btn-danger-bg)",
                                                            color: "var(--btn-danger-text)",
                                                            borderRadius: "44px",
                                                            cursor: loading ? "not-allowed" : "pointer",
                                                        }}
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Email Modal */}
            {showEmailModal && selectedOutingForEmail && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "var(--modal-overlay-bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "var(--card-bg)",
                            borderRadius: "8px",
                            padding: "30px",
                            maxWidth: "700px",
                            width: "90%",
                            maxHeight: "90vh",
                            overflow: "auto",
                            boxShadow: "var(--shadow-lg)",
                            border: "1px solid var(--card-border)",
                        }}
                    >
                        <h2
                            style={{
                                marginTop: 0,
                                marginBottom: "20px",
                                color: "var(--text-primary)",
                            }}
                        >
                            📧 Email Participants - {selectedOutingForEmail.name}
                        </h2>

                        {emailSuccess && (
                            <div
                                style={{
                                    padding: "12px",
                                    marginBottom: "20px",
                                    backgroundColor: "var(--alert-success-bg)",
                                    color: "var(--alert-success-text)",
                                    borderRadius: "4px",
                                    border: "1px solid var(--alert-success-border)",
                                }}
                            >
                                {emailSuccess}
                            </div>
                        )}

                        <div style={{ marginBottom: "20px" }}>
                            <h3 style={{ marginBottom: "10px" }}>
                                Email Addresses ({emailList.length})
                            </h3>
                            <div
                                style={{
                                    padding: "12px",
                                    backgroundColor: "var(--bg-tertiary)",
                                    borderRadius: "4px",
                                    border: "1px solid var(--card-border)",
                                    maxHeight: "150px",
                                    overflow: "auto",
                                    fontSize: "14px",
                                    wordBreak: "break-all",
                                    color: "var(--text-primary)",
                                }}
                            >
                                {emailList.length > 0
                                    ? emailList.join(", ")
                                    : "No email addresses found"}
                            </div>
                            <button
                                onClick={handleCopyEmails}
                                disabled={emailList.length === 0}
                                style={{
                                    marginTop: "10px",
                                    padding: "8px 16px",
                                    backgroundColor: "var(--btn-secondary-bg)",
                                    color: "var(--btn-secondary-text)",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: emailList.length === 0 ? "not-allowed" : "pointer",
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                }}
                            >
                                📋 Copy Email Addresses
                            </button>
                        </div>

                        <div style={{ marginBottom: "15px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "bold",
                                }}
                            >
                                Subject *
                            </label>
                            <input
                                type="text"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                placeholder="Email subject"
                                required
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    fontSize: "14px",
                                    border: "1px solid var(--input-border)",
                                    borderRadius: "4px",
                                    backgroundColor: "var(--input-bg)",
                                    color: "var(--text-primary)",
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "bold",
                                }}
                            >
                                Message *
                            </label>
                            <textarea
                                value={emailMessage}
                                onChange={(e) => setEmailMessage(e.target.value)}
                                placeholder="Enter your message to participants..."
                                required
                                rows={8}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    fontSize: "14px",
                                    border: "1px solid var(--input-border)",
                                    borderRadius: "4px",
                                    fontFamily: "inherit",
                                    backgroundColor: "var(--input-bg)",
                                    color: "var(--text-primary)",
                                }}
                            />
                        </div>

                        <div
                            style={{
                                padding: "12px",
                                backgroundColor: "var(--alert-warning-bg)",
                                borderRadius: "4px",
                                marginBottom: "20px",
                                fontSize: "13px",
                                color: "var(--alert-warning-text)",
                                border: "1px solid var(--alert-warning-border)",
                            }}
                        >
                            <strong>Note:</strong> Clicking "Send Email" will open your
                            default email client with the recipients, subject, and message
                            pre-filled. You can review and send from there.
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                justifyContent: "flex-end",
                            }}
                        >
                            <button
                                onClick={handleCloseEmailModal}
                                disabled={loading}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: "var(--btn-secondary-bg)",
                                    color: "var(--btn-secondary-text)",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    fontSize: "16px",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendEmail}
                                disabled={
                                    loading ||
                                    emailList.length === 0 ||
                                    !emailSubject ||
                                    !emailMessage
                                }
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor:
                                        emailList.length === 0 || !emailSubject || !emailMessage
                                            ? "var(--btn-disabled-bg)"
                                            : "var(--btn-success-bg)",
                                    color:
                                        emailList.length === 0 || !emailSubject || !emailMessage
                                            ? "var(--btn-disabled-text)"
                                            : "var(--btn-success-text)",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor:
                                        loading ||
                                            emailList.length === 0 ||
                                            !emailSubject ||
                                            !emailMessage
                                            ? "not-allowed"
                                            : "pointer",
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                }}
                            >
                                {loading ? "Preparing..." : "📧 Send Email"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {qrCodeOuting && (
                <OutingQRCode
                    outingId={qrCodeOuting.id}
                    outingName={qrCodeOuting.name}
                    isVisible={showQRCode}
                    onClose={handleCloseQRCode}
                />
            )}

            {/* Outing Creation Wizard */}
            <OutingWizard
                open={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSuccess={() => {
                    // After wizard completes, reload outings
                    loadOutings();
                    setIsWizardOpen(false);
                }}
            />
        </div>
    );
};

export default OutingAdmin;
