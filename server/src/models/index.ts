import mongoose, {
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

const baseOptions = { timestamps: true, versionKey: false } as const;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false },
    avatar: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    googleId: { type: String, sparse: true, unique: true },
    preferences: {
      goals: [String],
      categories: [String],
      experienceLevel: String,
      budget: String,
      outputPreference: String,
    },
    refreshTokenHash: { type: String, select: false },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    imageGenerationCount: { type: Number, min: 0, default: 0 },
    stripeCustomerId: { type: String, sparse: true, unique: true },
    stripeSubscriptionId: { type: String, sparse: true, unique: true },
    subscriptionStatus: {
      type: String,
      enum: ["inactive", "active", "trialing", "past_due", "canceled"],
      default: "inactive",
    },
    subscriptionCurrentPeriodEnd: Date,
  },
  baseOptions,
);

const toolSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    shortDescription: { type: String, required: true, maxlength: 220 },
    fullDescription: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Content",
        "Chat",
        "Data",
        "Documents",
        "Images",
        "Productivity",
        "Recommendations",
      ],
      required: true,
      index: true,
    },
    toolType: {
      type: String,
      enum: [
        "Generator",
        "Assistant",
        "Analyzer",
        "Classifier",
        "Recommendation Engine",
      ],
      required: true,
    },
    price: { type: Number, min: 0, default: 0 },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    imageUrl: { type: String, required: true },
    galleryImages: [String],
    features: [String],
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isPublished: { type: Boolean, default: true },
    tags: [String],
    usageCount: { type: Number, min: 0, default: 0 },
  },
  baseOptions,
);
toolSchema.index({ title: "text", shortDescription: "text", tags: "text" });

const reviewSchema = new Schema(
  {
    tool: {
      type: Schema.Types.ObjectId,
      ref: "Tool",
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 1200 },
  },
  baseOptions,
);
reviewSchema.index({ tool: 1, user: 1 }, { unique: true });

const favoriteSchema = new Schema(
  {
    tool: { type: Schema.Types.ObjectId, ref: "Tool", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  baseOptions,
);
favoriteSchema.index({ tool: 1, user: 1 }, { unique: true });

const conversationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "New conversation", maxlength: 100 },
  },
  baseOptions,
);

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  baseOptions,
);

const recommendationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    input: { type: Schema.Types.Mixed, required: true },
    results: [
      {
        tool: { type: Schema.Types.ObjectId, ref: "Tool" },
        score: Number,
        reason: String,
        relevantFeatures: [String],
      },
    ],
    refinement: String,
  },
  baseOptions,
);

const interactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recommendation: {
      type: Schema.Types.ObjectId,
      ref: "Recommendation",
      required: true,
    },
    tool: { type: Schema.Types.ObjectId, ref: "Tool", required: true },
    feedback: {
      type: String,
      enum: ["helpful", "not-helpful", "saved"],
      required: true,
    },
  },
  baseOptions,
);

const generationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    type: {
      type: String,
      enum: ["content", "document", "chat", "image"],
      required: true,
    },
    input: Schema.Types.Mixed,
    output: { type: String, required: true },
    title: String,
  },
  baseOptions,
);

const activitySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: { type: String, required: true },
    detail: { type: String, required: true },
    tool: { type: Schema.Types.ObjectId, ref: "Tool" },
  },
  baseOptions,
);

const contactSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: "new" },
  },
  baseOptions,
);

const blogSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String, required: true },
    author: { type: String, required: true },
    publishedAt: { type: Date, default: Date.now },
    readTime: { type: Number, required: true },
    isPublished: { type: Boolean, default: true },
  },
  baseOptions,
);

export type IUser = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = (mongoose.models.User ??
  mongoose.model("User", userSchema)) as mongoose.Model<
  InferSchemaType<typeof userSchema>
>;
export const Tool = (mongoose.models.Tool ??
  mongoose.model("Tool", toolSchema)) as mongoose.Model<
  InferSchemaType<typeof toolSchema>
>;
export const Review = (mongoose.models.Review ??
  mongoose.model("Review", reviewSchema)) as mongoose.Model<
  InferSchemaType<typeof reviewSchema>
>;
export const Favorite = (mongoose.models.Favorite ??
  mongoose.model("Favorite", favoriteSchema)) as mongoose.Model<
  InferSchemaType<typeof favoriteSchema>
>;
export const Conversation = (mongoose.models.Conversation ??
  mongoose.model("Conversation", conversationSchema)) as mongoose.Model<
  InferSchemaType<typeof conversationSchema>
>;
export const Message = (mongoose.models.Message ??
  mongoose.model("Message", messageSchema)) as mongoose.Model<
  InferSchemaType<typeof messageSchema>
>;
export const Recommendation = (mongoose.models.Recommendation ??
  mongoose.model("Recommendation", recommendationSchema)) as mongoose.Model<
  InferSchemaType<typeof recommendationSchema>
>;
export const RecommendationInteraction = (mongoose.models
  .RecommendationInteraction ??
  mongoose.model(
    "RecommendationInteraction",
    interactionSchema,
  )) as mongoose.Model<InferSchemaType<typeof interactionSchema>>;
export const Generation = (mongoose.models.Generation ??
  mongoose.model("Generation", generationSchema)) as mongoose.Model<
  InferSchemaType<typeof generationSchema>
>;
export const Activity = (mongoose.models.Activity ??
  mongoose.model("Activity", activitySchema)) as mongoose.Model<
  InferSchemaType<typeof activitySchema>
>;
export const Contact = (mongoose.models.Contact ??
  mongoose.model("Contact", contactSchema)) as mongoose.Model<
  InferSchemaType<typeof contactSchema>
>;
export const Blog = (mongoose.models.Blog ??
  mongoose.model("Blog", blogSchema)) as mongoose.Model<
  InferSchemaType<typeof blogSchema>
>;
