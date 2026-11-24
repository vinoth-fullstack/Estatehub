"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openApiDocument = void 0;
const zod_1 = require("zod");
const auth_schemas_1 = require("../modules/auth/auth.schemas");
const inquiry_schemas_1 = require("../modules/inquiries/inquiry.schemas");
const property_schemas_1 = require("../modules/properties/property.schemas");
const bodySchema = (schema) => {
    const { $schema: _ignored, ...jsonSchema } = zod_1.z.toJSONSchema(schema, {
        io: "input",
        unrepresentable: "any",
    });
    return jsonSchema;
};
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const jsonContent = (schema) => ({ "application/json": { schema } });
const dataResponse = (schema) => ({ type: "object", properties: { data: schema } });
const errorResponse = (description) => ({
    description,
    content: jsonContent(ref("Error")),
});
const idParam = (name = "id", description = "Resource id") => ({
    name,
    in: "path",
    required: true,
    description,
    schema: { type: "integer", minimum: 1 },
});
const pageParams = [
    { name: "page", in: "query", description: "1-based page number", schema: { type: "integer", minimum: 1, default: 1 } },
    { name: "limit", in: "query", description: "Rows per page; maximum 50", schema: { type: "integer", minimum: 1, maximum: 50, default: 20 } },
];
const secured = [{ bearerAuth: [] }];
const standardErrors = {
    "400": errorResponse("Validation or business rule failed"),
    "401": errorResponse("Missing or invalid access token"),
    "429": errorResponse("Rate limit exceeded"),
};
const listResponse = {
    "200": {
        description: "A page of property cards",
        content: jsonContent({
            type: "object",
            properties: { data: { type: "array", items: ref("PropertyCard") }, meta: ref("PageMeta") },
        }),
    },
    "400": errorResponse("Invalid filters or page is beyond the supported offset depth"),
};
const authUserResponse = {
    type: "object",
    properties: { user: ref("User"), accessToken: { type: "string" } },
};
const searchParameters = [
    {
        name: "q", in: "query",
        description: "Substring search across listing title, address, locality, city and state. Separate alternative groups with comma, semicolon or |; words within a group must all match.",
        schema: { type: "string", minLength: 2, maxLength: 100 }, example: "HSR Layout, Whitefield Bengaluru",
    },
    { name: "listingType", in: "query", description: "Sale or rental listing", schema: { type: "string", enum: [...property_schemas_1.LISTING_TYPES] } },
    { name: "propertyType", in: "query", schema: { type: "string", enum: [...property_schemas_1.PROPERTY_TYPES] } },
    { name: "minPrice", in: "query", description: "Minimum price or monthly rent in INR", schema: { type: "integer", minimum: 0 } },
    { name: "maxPrice", in: "query", description: "Maximum price or monthly rent in INR", schema: { type: "integer", minimum: 0 } },
    { name: "minArea", in: "query", description: "Minimum area in square feet", schema: { type: "integer", minimum: 0, maximum: 1_000_000 } },
    { name: "maxArea", in: "query", description: "Maximum area in square feet", schema: { type: "integer", minimum: 0, maximum: 1_000_000 } },
    { name: "bedrooms", in: "query", description: "Bedroom count; 5 means 5 or more", schema: { type: "integer", minimum: 0, maximum: 10 } },
    { name: "amenities", in: "query", description: "Comma-separated amenities; all supplied values must be present", schema: { type: "string", maxLength: 300 }, example: "Lift,Parking" },
    { name: "sort", in: "query", schema: { type: "string", enum: [...property_schemas_1.SORT_OPTIONS], default: "newest" } },
    { name: "page", in: "query", description: "1-based numbered page. Offset depth is capped at 100,000 rows; use cursor mode to continue deeper.", schema: { type: "integer", minimum: 1, default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 12 } },
    { name: "cursor", in: "query", description: "Keyset cursor from meta.nextCursor. When present, page is ignored and total is not calculated.", schema: { type: "string", maxLength: 300 } },
];
const uploadImagesBody = {
    required: true,
    content: {
        "multipart/form-data": {
            schema: {
                type: "object",
                required: ["images"],
                properties: {
                    images: { type: "array", minItems: 1, maxItems: 5, items: { type: "string", format: "binary" }, description: "JPEG, PNG, or WebP files; maximum 5 MiB each." },
                },
            },
        },
    },
};
exports.openApiDocument = {
    openapi: "3.0.3",
    info: {
        title: "EstateHub API",
        version: "1.1.0",
        description: "Complete REST API contract for the EstateHub real estate platform. Includes account and profile management, properties, images, search, inquiries, conversations, and health checks.\n\n" +
            "**Bearer authentication:** call `POST /api/auth/login`, copy `accessToken`, select *Authorize*, and enter the token. The refresh token is delivered separately as an HttpOnly cookie.\n\n" +
            "**Important:** image uploads use multipart field `images`; files are limited to JPEG, PNG, and WebP, 5 MiB each. This specification documents implemented routes; it does not imply a feature exists if no route is listed.",
    },
    servers: [{ url: "/", description: "Current API origin" }],
    tags: [
        { name: "System", description: "Health and operational status" },
        { name: "Auth", description: "Registration, sessions, profile and password management" },
        { name: "Properties", description: "Listings, search, images and similar properties" },
        { name: "Inquiries", description: "Owner inquiries and two-party conversations" },
    ],
    paths: {
        "/api/health": {
            get: {
                tags: ["System"], summary: "Check API and database health", operationId: "getHealth",
                responses: {
                    "200": { description: "API and database are available", content: jsonContent({ type: "object", properties: { status: { type: "string", example: "ok" }, database: { type: "string", enum: ["up"] }, uptimeSeconds: { type: "integer" } } }) },
                    "503": { description: "Database is unreachable", content: jsonContent({ type: "object", properties: { status: { type: "string", example: "degraded" }, database: { type: "string", example: "down" } } }) },
                },
            },
        },
        "/api/auth/register": {
            post: {
                tags: ["Auth"], summary: "Create an account", operationId: "register",
                requestBody: { required: true, content: jsonContent(bodySchema(auth_schemas_1.registerSchema)) },
                responses: {
                    "201": { description: "Account created; sets the refresh_token HttpOnly cookie", headers: { "Set-Cookie": { schema: { type: "string" }, description: "Refresh token cookie; HttpOnly, SameSite=Lax, Secure in production." } }, content: jsonContent(authUserResponse) },
                    "400": errorResponse("Invalid registration fields"), "409": errorResponse("Email already registered"), "429": errorResponse("Too many authentication attempts"),
                },
            },
        },
        "/api/auth/login": {
            post: {
                tags: ["Auth"], summary: "Sign in", operationId: "login",
                requestBody: { required: true, content: jsonContent(bodySchema(auth_schemas_1.loginSchema)) },
                responses: {
                    "200": { description: "Signed in; sets the refresh_token HttpOnly cookie", headers: { "Set-Cookie": { schema: { type: "string" } } }, content: jsonContent(authUserResponse) },
                    "400": errorResponse("Invalid login fields"), "401": errorResponse("Email or password is incorrect"), "429": errorResponse("Too many authentication attempts"),
                },
            },
        },
        "/api/auth/refresh": {
            post: {
                tags: ["Auth"], summary: "Rotate refresh token and issue a new access token", operationId: "refreshSession",
                description: "Reads the refresh_token cookie, revokes it, and returns a new access token and refresh cookie. Reuse of a revoked token revokes that user's refresh sessions.",
                security: [{ refreshCookie: [] }],
                responses: { "200": { description: "New access token and rotated refresh cookie", headers: { "Set-Cookie": { schema: { type: "string" } } }, content: jsonContent(authUserResponse) }, "401": errorResponse("Missing, expired, invalid or reused refresh token") },
            },
        },
        "/api/auth/logout": {
            post: {
                tags: ["Auth"], summary: "Revoke the refresh token and sign out", operationId: "logout",
                responses: { "204": { description: "Signed out and refresh cookie cleared" } },
            },
        },
        "/api/auth/forgot-password": {
            post: {
                tags: ["Auth"], summary: "Request password reset instructions", operationId: "requestPasswordReset",
                description: "Always returns a generic response to avoid disclosing whether an account exists. Email delivery requires RESEND_API_KEY to be configured.",
                requestBody: { required: true, content: jsonContent(bodySchema(auth_schemas_1.forgotPasswordSchema)) },
                responses: { "200": { description: "Generic response, regardless of account existence", content: jsonContent({ type: "object", properties: { message: { type: "string", example: "If an account exists for that email, password reset instructions will be sent shortly." } } }) }, "400": errorResponse("Invalid email"), "429": errorResponse("Too many reset requests") },
            },
        },
        "/api/auth/reset-password": {
            post: {
                tags: ["Auth"], summary: "Set a new password using a reset token", operationId: "resetPassword",
                requestBody: { required: true, content: jsonContent(bodySchema(auth_schemas_1.resetPasswordSchema)) },
                responses: { "200": { description: "Password changed and refresh sessions revoked", content: jsonContent({ type: "object", properties: { message: { type: "string" } } }) }, "400": errorResponse("Invalid, expired or already-used token/password"), "429": errorResponse("Too many reset requests") },
            },
        },
        "/api/auth/me": {
            get: {
                tags: ["Auth"], summary: "Get the current user's profile", operationId: "getCurrentUser", security: secured,
                responses: { "200": { description: "Safe profile fields; never includes password hash", content: jsonContent({ type: "object", properties: { user: ref("User") } }) }, "401": errorResponse("Not signed in"), "404": errorResponse("User not found") },
            },
            patch: {
                tags: ["Auth"], summary: "Update profile name, email or phone", operationId: "updateCurrentUser", security: secured,
                description: "Changing email requires currentPassword. The API does not currently send an email verification challenge.",
                requestBody: { required: true, content: jsonContent(bodySchema(auth_schemas_1.updateProfileSchema)) },
                responses: { "200": { description: "Updated safe profile", content: jsonContent({ type: "object", properties: { user: ref("User") } }) }, "400": errorResponse("Invalid profile data or current password required/incorrect"), "401": errorResponse("Not signed in"), "403": errorResponse("Not allowed"), "404": errorResponse("User not found"), "409": errorResponse("Email already in use"), "429": errorResponse("Rate limit exceeded") },
            },
        },
        "/api/auth/change-password": {
            post: {
                tags: ["Auth"], summary: "Change password while signed in", operationId: "changePassword", security: secured,
                requestBody: { required: true, content: jsonContent(bodySchema(auth_schemas_1.changePasswordSchema)) },
                responses: { "200": { description: "Password changed; refresh sessions are revoked", content: jsonContent({ type: "object", properties: { message: { type: "string" } } }) }, "400": errorResponse("Invalid current password, reused password or validation error"), "401": errorResponse("Not signed in") },
            },
        },
        "/api/auth/me/avatar": {
            post: {
                tags: ["Auth"], summary: "Upload or replace profile image", operationId: "uploadAvatar", security: secured,
                description: "Send exactly one image in multipart field `images`. Accepted formats are JPEG, PNG and WebP; max size 5 MiB. The file signature is checked by the API.",
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["images"],
                                properties: {
                                    images: { type: "array", minItems: 1, maxItems: 1, items: { type: "string", format: "binary" } },
                                },
                            },
                        },
                    },
                },
                responses: { "200": { description: "Updated safe profile", content: jsonContent({ type: "object", properties: { user: ref("User") } }) }, "400": errorResponse("Invalid image or multiple files supplied"), "401": errorResponse("Not signed in"), "429": errorResponse("Upload rate limit exceeded") },
            },
            delete: {
                tags: ["Auth"], summary: "Remove profile image", operationId: "removeAvatar", security: secured,
                responses: { "200": { description: "Profile image removed", content: jsonContent({ type: "object", properties: { user: ref("User") } }) }, "401": errorResponse("Not signed in") },
            },
        },
        "/api/properties": {
            get: { tags: ["Properties"], summary: "Search, filter and paginate listings", operationId: "searchProperties", parameters: searchParameters, responses: listResponse },
            post: {
                tags: ["Properties"], summary: "Create a property listing", operationId: "createProperty", security: secured,
                requestBody: { required: true, content: jsonContent(bodySchema(property_schemas_1.createPropertySchema)) },
                responses: { "201": { description: "Listing created", content: jsonContent(dataResponse(ref("PropertyDetail"))) }, ...standardErrors },
            },
        },
        "/api/properties/suggestions": {
            get: {
                tags: ["Properties"], summary: "Get location and property autocomplete suggestions", operationId: "suggestProperties",
                parameters: [{ name: "q", in: "query", required: true, description: "At least 2 characters; maximum 80", schema: { type: "string", minLength: 2, maxLength: 80 }, example: "whitef" }],
                responses: { "200": { description: "Up to eight unique active-listing suggestions", content: jsonContent(dataResponse({ type: "array", items: ref("PropertySuggestion") })) }, "400": errorResponse("Invalid query"), "429": errorResponse("Rate limit exceeded") },
            },
        },
        "/api/properties/mine": {
            get: { tags: ["Properties"], summary: "List the signed-in owner's properties, including inactive", operationId: "listMyProperties", security: secured, parameters: searchParameters, responses: { ...listResponse, "401": errorResponse("Not signed in") } },
        },
        "/api/properties/sitemap": {
            get: {
                tags: ["Properties"], summary: "Get active listing entries for sitemap", operationId: "getPropertySitemap",
                parameters: [{ name: "limit", in: "query", description: "Maximum number of entries", schema: { type: "integer", minimum: 1, maximum: 5000, default: 1000 } }],
                responses: { "200": { description: "Listing IDs, titles, and updated dates", content: jsonContent(dataResponse({ type: "array", items: ref("SitemapEntry") })) }, "400": errorResponse("Invalid limit") },
            },
        },
        "/api/properties/{id}": {
            get: {
                tags: ["Properties"], summary: "Get property details", operationId: "getProperty", parameters: [idParam()],
                description: "Optional bearer auth lets an owner view their inactive listing. Inactive listings are otherwise hidden.",
                security: [{}, ...secured],
                responses: { "200": { description: "Property detail and images", content: jsonContent(dataResponse(ref("PropertyDetail"))) }, "400": errorResponse("Invalid id"), "404": errorResponse("Property not found or inactive for this viewer") },
            },
            put: {
                tags: ["Properties"], summary: "Update an owned property", operationId: "updateProperty", security: secured, parameters: [idParam()],
                requestBody: { required: true, content: jsonContent(bodySchema(property_schemas_1.updatePropertySchema)) },
                responses: { "200": { description: "Updated listing", content: jsonContent(dataResponse(ref("PropertyDetail"))) }, ...standardErrors, "403": errorResponse("Listing belongs to another user"), "404": errorResponse("Property not found") },
            },
            delete: {
                tags: ["Properties"], summary: "Delete an owned property", operationId: "deleteProperty", security: secured, parameters: [idParam()],
                responses: { "204": { description: "Listing and dependent database records deleted" }, "401": errorResponse("Not signed in"), "403": errorResponse("Listing belongs to another user"), "404": errorResponse("Property not found") },
            },
        },
        "/api/properties/{id}/similar": {
            get: {
                tags: ["Properties"], summary: "Get similar property listings", operationId: "getSimilarProperties", parameters: [idParam()],
                description: "Deterministic SQL ranking; first matches city/listing/property type and ±25% price, then relaxes property type and uses ±50% to fill up to six results. Not an AI recommendation endpoint.",
                responses: { "200": { description: "Zero to six similar listing cards", content: jsonContent(dataResponse({ type: "array", items: ref("PropertyCard") })) }, "404": errorResponse("Active property not found") },
            },
        },
        "/api/properties/{id}/images": {
            post: {
                tags: ["Properties"], summary: "Upload listing images", operationId: "uploadPropertyImages", security: secured, parameters: [idParam()], requestBody: uploadImagesBody,
                description: "Maximum five files per request and ten images on a listing. JPEG, PNG and WebP only; max 5 MiB per file. Owner authorization is required.",
                responses: { "201": { description: "Uploaded image records", content: jsonContent(dataResponse({ type: "array", items: { type: "object", properties: { id: { type: "integer" }, url: { type: "string" }, position: { type: "integer" } } } })) }, "400": errorResponse("Invalid image, no file, or listing image limit exceeded"), "401": errorResponse("Not signed in"), "403": errorResponse("Listing belongs to another user"), "404": errorResponse("Property not found"), "429": errorResponse("Upload rate limit exceeded") },
            },
        },
        "/api/properties/{id}/images/{imageId}": {
            delete: {
                tags: ["Properties"], summary: "Delete an image from an owned listing", operationId: "deletePropertyImage", security: secured, parameters: [idParam(), idParam("imageId", "Image id")],
                responses: { "204": { description: "Image deleted" }, "400": errorResponse("Invalid id"), "401": errorResponse("Not signed in"), "403": errorResponse("Listing belongs to another user"), "404": errorResponse("Property or image not found") },
            },
        },
        "/api/properties/{propertyId}/inquiries": {
            post: {
                tags: ["Inquiries"], summary: "Send an inquiry to a property owner", operationId: "createInquiry", security: secured,
                description: "One inquiry per user per property; limited to five per hour per user. The website field is a honeypot and should be left blank.",
                parameters: [idParam("propertyId", "Property id")], requestBody: { required: true, content: jsonContent(bodySchema(inquiry_schemas_1.createInquirySchema)) },
                responses: { "201": { description: "Inquiry created", content: jsonContent({ type: "object", properties: { data: ref("CreatedInquiry"), message: { type: "string" } } }) }, ...standardErrors, "403": errorResponse("Not allowed"), "404": errorResponse("Property not found or inactive"), "409": errorResponse("Duplicate inquiry for this property") },
            },
        },
        "/api/inquiries/received": {
            get: {
                tags: ["Inquiries"], summary: "List inquiries received on owned properties", operationId: "listReceivedInquiries", security: secured, parameters: pageParams,
                responses: { "200": { description: "Private paginated inquiries with property image and requester contact/profile details", content: jsonContent(ref("ReceivedInquiryPage")) }, "400": errorResponse("Invalid pagination"), "401": errorResponse("Not signed in") },
            },
        },
        "/api/inquiries/sent": {
            get: {
                tags: ["Inquiries"], summary: "List inquiries sent by the current user", operationId: "listSentInquiries", security: secured, parameters: pageParams,
                responses: { "200": { description: "Private paginated inquiries with property image and recipient owner details", content: jsonContent(ref("SentInquiryPage")) }, "400": errorResponse("Invalid pagination"), "401": errorResponse("Not signed in") },
            },
        },
        "/api/inquiries/{inquiryId}/messages": {
            get: {
                tags: ["Inquiries"], summary: "Get the chronological inquiry conversation", operationId: "getConversation", security: secured, parameters: [idParam("inquiryId", "Inquiry id")],
                description: "Only the original sender or the current owner of the property can read the conversation. The initial inquiry is returned as its first message.",
                responses: { "200": { description: "Chronological initial inquiry and replies", content: jsonContent(dataResponse({ type: "array", items: ref("ConversationMessage") })) }, "401": errorResponse("Not signed in"), "403": errorResponse("Not a conversation participant"), "404": errorResponse("Inquiry not found") },
            },
            post: {
                tags: ["Inquiries"], summary: "Send a reply in the inquiry conversation", operationId: "replyToInquiry", security: secured, parameters: [idParam("inquiryId", "Inquiry id")],
                requestBody: { required: true, content: jsonContent(bodySchema(inquiry_schemas_1.inquiryMessageSchema)) },
                responses: { "201": { description: "Message created", content: jsonContent(dataResponse(ref("ConversationMessage"))) }, "400": errorResponse("Invalid message"), "401": errorResponse("Not signed in"), "403": errorResponse("Not a conversation participant"), "404": errorResponse("Inquiry not found") },
            },
        },
        "/api/inquiries/{inquiryId}/status": {
            patch: {
                tags: ["Inquiries"], summary: "Accept or reject a received inquiry", operationId: "updateInquiryStatus", security: secured, parameters: [idParam("inquiryId", "Inquiry id")],
                description: "Only the property owner can update the status. Allowed updates are accepted and rejected.",
                requestBody: { required: true, content: jsonContent(bodySchema(inquiry_schemas_1.inquiryStatusSchema)) },
                responses: { "200": { description: "Updated inquiry status", content: jsonContent(dataResponse({ type: "object", properties: { id: { type: "integer" }, status: { type: "string", enum: ["accepted", "rejected"] } } })) }, "400": errorResponse("Invalid status"), "401": errorResponse("Not signed in"), "403": errorResponse("Only the property owner may update status"), "404": errorResponse("Inquiry not found") },
            },
        },
    },
    components: {
        securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
            refreshCookie: { type: "apiKey", in: "cookie", name: "refresh_token", description: "HttpOnly refresh token set by login/register; browser-managed." },
        },
        schemas: {
            Error: {
                type: "object", properties: {
                    error: { type: "object", properties: { code: { type: "string", example: "VALIDATION_ERROR" }, message: { type: "string" }, details: { oneOf: [{ type: "array", items: { type: "object", properties: { path: { type: "string" }, message: { type: "string" } } } }, { type: "object", nullable: true }] } } },
                },
            },
            User: {
                type: "object", properties: {
                    id: { type: "integer" }, name: { type: "string" }, email: { type: "string", format: "email" }, phone: { type: "string", nullable: true },
                    avatarUrl: { type: "string", nullable: true }, createdAt: { type: "string", format: "date-time" },
                },
            },
            PropertySuggestion: { type: "object", properties: { value: { type: "string" }, label: { type: "string" }, detail: { type: "string" }, kind: { type: "string", enum: ["locality", "city", "property"] } } },
            SitemapEntry: { type: "object", properties: { id: { type: "integer" }, title: { type: "string" }, updatedAt: { type: "string", format: "date-time" } } },
            AuthResponse: authUserResponse,
            PageMeta: { type: "object", properties: { page: { type: "integer", nullable: true }, limit: { type: "integer" }, total: { type: "integer", nullable: true }, totalPages: { type: "integer", nullable: true }, hasNextPage: { type: "boolean" }, nextCursor: { type: "string", nullable: true } } },
            PropertyCard: {
                type: "object", properties: {
                    id: { type: "integer" }, title: { type: "string" }, propertyType: { type: "string", enum: [...property_schemas_1.PROPERTY_TYPES] },
                    listingType: { type: "string", enum: [...property_schemas_1.LISTING_TYPES] }, price: { type: "integer" }, bedrooms: { type: "integer" },
                    bathrooms: { type: "integer" }, areaSqft: { type: "integer" }, locality: { type: "string" }, city: { type: "string" },
                    state: { type: "string" }, status: { type: "string", enum: ["active", "inactive"] }, createdAt: { type: "string", format: "date-time" }, coverImageUrl: { type: "string", nullable: true },
                },
            },
            PropertyDetail: {
                allOf: [ref("PropertyCard"), {
                        type: "object", properties: {
                            description: { type: "string" }, addressLine: { type: "string" }, pincode: { type: "string" }, amenities: { type: "array", items: { type: "string" } },
                            updatedAt: { type: "string", format: "date-time" }, images: { type: "array", items: { type: "object", properties: { id: { type: "integer" }, url: { type: "string" }, position: { type: "integer" } } } },
                            owner: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" } } }, isOwner: { type: "boolean" },
                        }
                    }],
            },
            CreatedInquiry: { type: "object", description: "For the honeypot path, id is null and no inquiry is stored.", properties: { id: { type: "integer", nullable: true }, createdAt: { type: "string", format: "date-time" } } },
            InquiryRecordBase: {
                type: "object", properties: {
                    id: { type: "integer" }, propertyId: { type: "integer" }, propertyTitle: { type: "string" }, locality: { type: "string" }, city: { type: "string" }, price: { type: "integer" },
                    message: { type: "string" }, status: { type: "string", enum: ["pending", "replied", "accepted", "rejected"] }, createdAt: { type: "string", format: "date-time" }, coverImageUrl: { type: "string", nullable: true },
                    ownerId: { type: "integer" }, ownerName: { type: "string" }, ownerAvatarUrl: { type: "string", nullable: true },
                },
            },
            ReceivedInquiry: { allOf: [ref("InquiryRecordBase"), { type: "object", properties: { name: { type: "string" }, email: { type: "string", format: "email" }, phone: { type: "string" }, requesterAvatarUrl: { type: "string", nullable: true } } }] },
            SentInquiry: { allOf: [ref("InquiryRecordBase")] },
            InquiryPageMeta: { type: "object", properties: { page: { type: "integer" }, limit: { type: "integer" }, total: { type: "integer" }, totalPages: { type: "integer" } } },
            ReceivedInquiryPage: { type: "object", properties: { data: { type: "array", items: ref("ReceivedInquiry") }, meta: ref("InquiryPageMeta") } },
            SentInquiryPage: { type: "object", properties: { data: { type: "array", items: ref("SentInquiry") }, meta: ref("InquiryPageMeta") } },
            ConversationMessage: { type: "object", properties: { id: { type: "integer", description: "Initial inquiry uses a negative ID; reply rows use their database ID." }, inquiryId: { type: "integer" }, senderId: { type: "integer" }, senderName: { type: "string" }, senderAvatarUrl: { type: "string", nullable: true }, message: { type: "string" }, createdAt: { type: "string", format: "date-time" } } },
        },
    },
};
