import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

function classifyIntent(query: string): string {
  const queryClean = query.trim().toLowerCase();
  const queryCleanNoPunct = queryClean.replace(/[^\w\s]/g, '');

  const productTerms = [
    "power connector", "connector", "sb50", "sb75", "terminal block",
    "wire harness", "cable assembly", "heat shrink sleeve", "mc4",
    "xt60", "xt90", "rj45", "idc", "wire", "harness", "cable",
    "terminal", "sleeve"
  ];

  let containsProduct = false;
  for (const pt of productTerms) {
    if (queryCleanNoPunct.includes(pt) || ` ${queryCleanNoPunct} `.includes(` ${pt} `)) {
      containsProduct = true;
      break;
    }
  }

  // 1. Quote Request triggers
  const quoteTriggers = ["need quotation", "send quote", "pricing", "price", "cost", "quotation", "rates", "price list"];
  if (quoteTriggers.some(qt => queryCleanNoPunct.includes(qt))) {
    return "QUOTE_REQUEST";
  }

  // 2. Contact triggers
  const contactTriggers = ["contact number", "phone number", "email address", "sales contact", "call me", "contact", "phone", "email"];
  if (contactTriggers.some(ct => queryCleanNoPunct.includes(ct))) {
    return "CONTACT";
  }

  // 3. Shipping triggers
  const shippingTriggers = ["delivery available", "shipping charges", "dispatch time", "courier service", "delivery", "shipping", "dispatch", "courier"];
  if (shippingTriggers.some(st => queryCleanNoPunct.includes(st))) {
    return "SHIPPING";
  }

  // 4. FAQ triggers - only if no product name is present
  if (!containsProduct) {
    const faqTriggers = ["office timing", "office location", "gst number", "who are you", "about company", "payment methods", "where are you located", "gst", "payment", "timing", "hours", "located", "location", "address"];
    if (faqTriggers.some(ft => queryCleanNoPunct.includes(ft))) {
      return "FAQ";
    }
  }

  // 5. Product info triggers
  const infoTriggers = ["what is", "tell me about", "explain", "features", "uses", "details", "specifications", "applications", "where is"];
  if (infoTriggers.some(it => queryCleanNoPunct.includes(it))) {
    return "PRODUCT_INFO";
  }

  // 6. Product search triggers
  if (containsProduct) {
    return "PRODUCT_SEARCH";
  }

  return "GENERAL";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json({ message: 'Message is required' }, { status: 400 });
    }

    const currentSessionId = sessionId || new ObjectId().toString();

    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);

    // Check if the query is an exact category name click/query
    try {
      const exactCategory = await db.collection('categories').findOne({
        name: { $regex: new RegExp(`^${message.trim()}$`, 'i') }
      });
      if (exactCategory) {
        const catIdStr = exactCategory._id.toString();
        const prods = await db.collection('products').find({ category_id: catIdStr }).toArray();

        const matches: any[] = [];
        for (const p of prods) {
          matches.push({
            id: p._id.toString(),
            name: p.name,
            sku: p.sku || '',
            type: 'standard',
            link: `/products/${p._id.toString()}`,
            image: p.image || ''
          });
        }

        const catNameLower = exactCategory.name.toLowerCase();
        if (catNameLower.includes('ev')) {
          const evProds = await db.collection('ev_products').find({}).toArray();
          for (const p of evProds) {
            matches.push({
              id: p._id.toString(),
              name: p.title,
              sku: '',
              type: 'ev',
              link: '/ev-products',
              image: p.image || ''
            });
          }
        }
        if (catNameLower.includes('harness')) {
          const harnessProds = await db.collection('harness_products').find({}).toArray();
          for (const p of harnessProds) {
            matches.push({
              id: p._id.toString(),
              name: p.title,
              sku: '',
              type: 'harness',
              link: '/wire-harness-products',
              image: p.image || ''
            });
          }
        }

        const suggs = ["Request a Quote", "Show Categories", "Chat on WhatsApp"];
        if (matches.length > 0) {
          console.log(`[Chatbot Routing Log]`);
          console.log(`  User Query: "${message}"`);
          console.log(`  Detected Intent: CATEGORY_CLICK`);
          console.log(`  Product Results Count: ${matches.length}`);
          console.log(`  FAQ Results Count: 0`);
          console.log(`  Final Route Chosen: CATEGORY_CLICK`);

          const userMsgObj = { sender: 'user' as const, text: message, timestamp: new Date() };
          const botMsgObj = { sender: 'bot' as const, text: `Here are the products under the **${exactCategory.name}** category:`, products: matches, timestamp: new Date() };
          await db.collection('chatbot_conversations').updateOne({ sessionId: currentSessionId }, { $push: { messages: { $each: [userMsgObj, botMsgObj] } } } as any, { upsert: true });

          return NextResponse.json({
            sessionId: currentSessionId,
            reply: `Here are the products under the **${exactCategory.name}** category:`,
            suggestions: suggs,
            products: matches
          });
        } else {
          const categoriesList = [{
            id: catIdStr,
            name: exactCategory.name,
            description: exactCategory.description || '',
            image: exactCategory.image || '',
            link: `/products?category=${catIdStr}`
          }];
          console.log(`[Chatbot Routing Log]`);
          console.log(`  User Query: "${message}"`);
          console.log(`  Detected Intent: CATEGORY_CLICK`);
          console.log(`  Product Results Count: 0`);
          console.log(`  FAQ Results Count: 0`);
          console.log(`  Final Route Chosen: CATEGORY_CLICK`);

          const userMsgObj = { sender: 'user' as const, text: message, timestamp: new Date() };
          const botMsgObj = { sender: 'bot' as const, text: `Here is the details for the **${exactCategory.name}** category:`, timestamp: new Date() };
          await db.collection('chatbot_conversations').updateOne({ sessionId: currentSessionId }, { $push: { messages: { $each: [userMsgObj, botMsgObj] } } } as any, { upsert: true });

          return NextResponse.json({
            sessionId: currentSessionId,
            reply: `Here is the details for the **${exactCategory.name}** category:`,
            suggestions: suggs,
            products: [],
            categories: categoriesList
          });
        }
      }
    } catch (err) {
      console.error("Error checking exact category click:", err);
    }

    // 1. Get Chatbot Settings
    const settings = await db.collection('chatbot_settings').findOne({ _id: 'global_settings' as any });
    const fallbackMessage = settings?.fallbackMessage || "I'm sorry, I couldn't find an answer to your question. Would you like to submit an inquiry or contact us on WhatsApp?";
    const greetingMessage = settings?.greetingMessage || "Hi, I am Aaj Tech virtual assistant. How can I help you today?";

    const cleanMsg = message.toLowerCase().trim();
    const queryTerms = cleanMsg.split(' ').filter((t: string) => t.length > 2);
    const searchRegex = new RegExp(queryTerms.join('|') || '$$$', 'i');

    const intent = classifyIntent(message);

    let replyText = '';
    let suggestions: string[] = [];
    let matchedProducts: any[] = [];
    let matchedCategories: any[] = [];
    let isLeadForm = false;
    let productCount = 0;
    let faqCount = 0;
    let finalRoute = intent;

    const getIntentResponse = async (intentName: string): Promise<string | null> => {
      try {
        const intentDoc = await db.collection('chatbot_intents').findOne({
          intent: { $regex: new RegExp(`^${intentName}$`, 'i') },
          isActive: true
        });
        return intentDoc?.response || null;
      } catch (err) {
        console.error(`Error fetching intent response for ${intentName}:`, err);
        return null;
      }
    };

    // FAQ Fallback Helper
    const searchFaqsFallback = async (): Promise<any> => {
      const faqs = await db.collection('chatbot_faqs').find({}).toArray();
      let matchedFaq = null;
      let faqCnt = 0;
      for (const faq of faqs) {
        const question = faq.question.toLowerCase();
        const qClean = question.replace(/[^\w\s]/g, '');
        const queryCleanNoPunct = cleanMsg.replace(/[^\w\s]/g, '');

        if (queryCleanNoPunct.includes(qClean) || qClean.includes(queryCleanNoPunct)) {
          faqCnt++;
          if (!matchedFaq) matchedFaq = faq;
        } else if (faq.keywords && Array.isArray(faq.keywords)) {
          const keywordMatch = faq.keywords.some((kw: string) => {
            const kwClean = kw.toLowerCase().replace(/[^\w\s]/g, '');
            return queryCleanNoPunct.includes(kwClean) || kwClean.includes(queryCleanNoPunct);
          });
          if (keywordMatch) {
            faqCnt++;
            if (!matchedFaq) matchedFaq = faq;
          }
        }
      }

      if (matchedFaq) {
        faqCount = faqCnt;
        return {
          reply: matchedFaq.answer,
          suggestions: ['Show Categories', 'Submit Inquiry', 'Chat on WhatsApp'],
          products: [],
          categories: []
        };
      }
      return null;
    };

    if (intent === 'QUOTE_REQUEST') {
      const resp = await getIntentResponse('QUOTE_REQUEST');
      replyText = resp || "Please fill out the form below to submit your inquiry directly to our sales team:";
      suggestions = ["Show Categories", "Chat on WhatsApp"];
      isLeadForm = true;

    } else if (intent === 'CONTACT') {
      const resp = await getIntentResponse('CONTACT');
      replyText = resp || "You can reach us at sales@aajtechtrading.com or call our team.";
      suggestions = ["Submit Inquiry", "Show Categories", "Chat on WhatsApp"];

    } else if (intent === 'SHIPPING') {
      const resp = await getIntentResponse('SHIPPING');
      replyText = resp || "We offer prompt shipping and dispatch. Please contact sales for specific delivery schedules.";
      suggestions = ["Submit Inquiry", "Show Categories", "Chat on WhatsApp"];

    } else if (intent === 'PRODUCT_SEARCH') {
      // Search products
      const products = await db.collection('products')
        .find({
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { sku: searchRegex }
          ]
        })
        .limit(3)
        .toArray();

      let evProducts: any[] = [];
      if (products.length < 3) {
        evProducts = await db.collection('ev_products')
          .find({
            $or: [
              { title: searchRegex },
              { details: searchRegex },
              { applications: searchRegex }
            ]
          })
          .limit(3 - products.length)
          .toArray();
      }

      let harnessProducts: any[] = [];
      if (products.length + evProducts.length < 3) {
        harnessProducts = await db.collection('harness_products')
          .find({
            $or: [
              { title: searchRegex },
              { details: searchRegex },
              { applications: searchRegex }
            ]
          })
          .limit(3 - (products.length + evProducts.length))
          .toArray();
      }

      const matches = [
        ...products.map(p => ({
          id: p._id.toString(),
          name: p.name,
          sku: p.sku || '',
          type: 'standard',
          link: `/products/${p._id.toString()}`,
          image: p.image || ''
        })),
        ...evProducts.map(p => ({
          id: p._id.toString(),
          name: p.title,
          sku: '',
          type: 'ev',
          link: '/ev-products',
          image: p.image || ''
        })),
        ...harnessProducts.map(p => ({
          id: p._id.toString(),
          name: p.title,
          sku: '',
          type: 'harness',
          link: '/wire-harness-products',
          image: p.image || ''
        }))
      ];

      if (matches.length > 0) {
        productCount = matches.length;
        replyText = `I found these matching products from our database. Select a product to view details:`;
        matchedProducts = matches;
        suggestions = ['Request a Quote', 'Show Categories', 'Chat on WhatsApp'];
      } else {
        // Fallback to FAQ
        const faqRes = await searchFaqsFallback();
        if (faqRes) {
          finalRoute = 'PRODUCT_SEARCH_TO_FAQ';
          replyText = faqRes.reply;
          suggestions = faqRes.suggestions;
        } else {
          replyText = fallbackMessage;
          suggestions = ['Submit Inquiry', 'Chat on WhatsApp', 'Show Categories'];
        }
      }

    } else if (intent === 'PRODUCT_INFO') {
      // Search product details
      const products = await db.collection('products')
        .find({
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { sku: searchRegex }
          ]
        })
        .limit(3)
        .toArray();

      let evProducts: any[] = [];
      if (products.length < 3) {
        evProducts = await db.collection('ev_products')
          .find({
            $or: [
              { title: searchRegex },
              { details: searchRegex },
              { applications: searchRegex }
            ]
          })
          .limit(3 - products.length)
          .toArray();
      }

      let harnessProducts: any[] = [];
      if (products.length + evProducts.length < 3) {
        harnessProducts = await db.collection('harness_products')
          .find({
            $or: [
              { title: searchRegex },
              { details: searchRegex },
              { applications: searchRegex }
            ]
          })
          .limit(3 - (products.length + evProducts.length))
          .toArray();
      }

      const matches = [
        ...products.map(p => ({
          id: p._id.toString(),
          name: p.name,
          sku: p.sku || '',
          type: 'standard',
          link: `/products/${p._id.toString()}`,
          image: p.image || ''
        })),
        ...evProducts.map(p => ({
          id: p._id.toString(),
          name: p.title,
          sku: '',
          type: 'ev',
          link: '/ev-products',
          image: p.image || ''
        })),
        ...harnessProducts.map(p => ({
          id: p._id.toString(),
          name: p.title,
          sku: '',
          type: 'harness',
          link: '/wire-harness-products',
          image: p.image || ''
        }))
      ];

      const firstProduct = products[0] || evProducts[0] || harnessProducts[0];
      if (firstProduct) {
        productCount = matches.length;
        const pName = firstProduct.name || firstProduct.title || '';
        const pDesc = firstProduct.description || firstProduct.details || '';
        replyText = `Here is the product details for **${pName}**:\n\n${pDesc}`;
        matchedProducts = matches;
        suggestions = ['Request a Quote', 'Ask something else', 'Connect on WhatsApp'];
      } else {
        // Fallback to FAQ
        const faqRes = await searchFaqsFallback();
        if (faqRes) {
          finalRoute = 'PRODUCT_INFO_TO_FAQ';
          replyText = faqRes.reply;
          suggestions = faqRes.suggestions;
        } else {
          replyText = fallbackMessage;
          suggestions = ['Submit Inquiry', 'Chat on WhatsApp', 'Show Categories'];
        }
      }

    } else if (intent === 'FAQ') {
      // Search FAQ knowledge base
      const faqs = await db.collection('chatbot_faqs').find({}).toArray();
      let matchedFaq = null;
      for (const faq of faqs) {
        const question = faq.question.toLowerCase();
        const qClean = question.replace(/[^\w\s]/g, '');
        const queryCleanNoPunct = cleanMsg.replace(/[^\w\s]/g, '');

        if (queryCleanNoPunct.includes(qClean) || qClean.includes(queryCleanNoPunct)) {
          faqCount++;
          if (!matchedFaq) matchedFaq = faq;
        } else if (faq.keywords && Array.isArray(faq.keywords)) {
          const keywordMatch = faq.keywords.some((kw: string) => {
            const kwClean = kw.toLowerCase().replace(/[^\w\s]/g, '');
            return queryCleanNoPunct.includes(kwClean) || kwClean.includes(queryCleanNoPunct);
          });
          if (keywordMatch) {
            faqCount++;
            if (!matchedFaq) matchedFaq = faq;
          }
        }
      }

      if (matchedFaq) {
        replyText = matchedFaq.answer;
        suggestions = ['Show Categories', 'Submit Inquiry', 'Chat on WhatsApp'];
      } else {
        replyText = fallbackMessage;
        suggestions = ['Submit Inquiry', 'Chat on WhatsApp', 'Show Categories'];
      }

    } else { // GENERAL
      // 1. Check greetings
      const greetingTriggers = ["hi", "hello", "hey", "greetings", "good morning", "good afternoon"];
      const isGreeting = greetingTriggers.some(gt => ` ${cleanMsg} `.includes(` ${gt} `));

      if (isGreeting) {
        replyText = greetingMessage;
        suggestions = ["Products Offered", "Submit Inquiry", "Chat on WhatsApp"];
      } else {
        // 2. Check categories list trigger
        const categoryIntents = [
          "show product categories", "show categories", "list categories", "view categories", 
          "what categories", "product categories", "categories", 
          "type of product", "types of product", "type of products", "types of products", 
          "kind of product", "kinds of product", "kind of products", "kinds of products",
          "what kind of product", "what kinds of products", "what kind of products",
          "how many type", "how many types", "how many product", "how many products",
          "range of product", "range of products", "product range", "product ranges",
          "what products", "products offered", "show products", "list products", 
          "view products", "what products", "products", "show me the product",
          "show me the products", "show me product", "show me products", "show product",
          "list product", "view product", "product", "all products", "all product",
          "show all products", "show all product", "all categories", "show all categories"
        ];
        const isCategoryQuery = categoryIntents.some(cat => cleanMsg.includes(cat)) || cleanMsg === 'categories' || cleanMsg === 'products' || cleanMsg === 'product';

        if (isCategoryQuery) {
          const cats = await db.collection('categories').find({}).sort({ sequence: 1 }).toArray();
          if (cats && cats.length > 0) {
            replyText = "Here are the product categories we offer. Select any category to view more details:";
            suggestions = cats.slice(0, 3).map(c => c.name).concat(["Submit Inquiry", "Chat on WhatsApp"]);
            matchedCategories = cats.map(c => ({
              id: c._id.toString(),
              name: c.name,
              description: c.description || '',
              image: c.image || '',
              link: `/products?category=${c._id.toString()}`
            }));
          }
        }

        // 3. Check products list trigger
        if (!replyText) {
          const productIntents = [
            "products offered", "show products", "list products", "view products", 
            "what products", "products", "types of products", "kinds of products",
            "product range", "product ranges", "range of products", "show me the product",
            "show me the products", "show me product", "show me products", "show product",
            "list product", "view product", "product", "all products", "all product",
            "show all products", "show all product", "all categories", "show all categories"
          ];
          const isProductsListQuery = productIntents.some(pInt => cleanMsg.includes(pInt)) || cleanMsg === 'products' || cleanMsg === 'product';

          if (isProductsListQuery) {
            const cats = await db.collection('categories').find({}).sort({ sequence: 1 }).toArray();
            if (cats && cats.length > 0) {
              replyText = "We offer a wide range of industrial components. Select a category below to browse the products:";
              suggestions = cats.slice(0, 3).map(c => c.name).concat(["Submit Inquiry", "Chat on WhatsApp"]);
              matchedCategories = cats.map(c => ({
                id: c._id.toString(),
                name: c.name,
                description: c.description || '',
                image: c.image || '',
                link: `/products?category=${c._id.toString()}`
              }));
            }
          }
        }

        // 4. Default regex product search
        if (!replyText) {
          const products = await db.collection('products')
            .find({
              $or: [
                { name: searchRegex },
                { description: searchRegex },
                { sku: searchRegex }
              ]
            })
            .limit(3)
            .toArray();

          let evProducts: any[] = [];
          if (products.length < 3) {
            evProducts = await db.collection('ev_products')
              .find({
                $or: [
                  { title: searchRegex },
                  { details: searchRegex },
                  { applications: searchRegex }
                ]
              })
              .limit(3 - products.length)
              .toArray();
          }

          let harnessProducts: any[] = [];
          if (products.length + evProducts.length < 3) {
            harnessProducts = await db.collection('harness_products')
              .find({
                $or: [
                  { title: searchRegex },
                  { details: searchRegex },
                  { applications: searchRegex }
                ]
              })
              .limit(3 - (products.length + evProducts.length))
              .toArray();
          }

          const matches = [
            ...products.map(p => ({
              id: p._id.toString(),
              name: p.name,
              sku: p.sku || '',
              type: 'standard',
              link: `/products/${p._id.toString()}`,
              image: p.image || ''
            })),
            ...evProducts.map(p => ({
              id: p._id.toString(),
              name: p.title,
              sku: '',
              type: 'ev',
              link: '/ev-products',
              image: p.image || ''
            })),
            ...harnessProducts.map(p => ({
              id: p._id.toString(),
              name: p.title,
              sku: '',
              type: 'harness',
              link: '/wire-harness-products',
              image: p.image || ''
            }))
          ];

          if (matches.length > 0) {
            productCount = matches.length;
            replyText = `I found these matching products from our database. Select a product to view details:`;
            matchedProducts = matches;
            suggestions = ['Request a Quote', 'Show Categories', 'Chat on WhatsApp'];
          } else {
            const faqRes = await searchFaqsFallback();
            if (faqRes) {
              finalRoute = 'GENERAL_TO_FAQ';
              replyText = faqRes.reply;
              suggestions = faqRes.suggestions;
            } else {
              replyText = fallbackMessage;
              suggestions = ['Submit Inquiry', 'Chat on WhatsApp', 'Show Categories'];
            }
          }
        }
      }
    }

    // Print routing logs to console
    console.log(`[Chatbot Routing Log]`);
    console.log(`  User Query: "${message}"`);
    console.log(`  Detected Intent: ${intent}`);
    console.log(`  Product Results Count: ${productCount}`);
    console.log(`  FAQ Results Count: ${faqCount}`);
    console.log(`  Final Route Chosen: ${finalRoute}`);

    // 4. Record Conversation Transcript
    const userMsgObj = {
      sender: 'user' as const,
      text: message,
      timestamp: new Date()
    };

    const botMsgObj = {
      sender: 'bot' as const,
      text: replyText,
      products: matchedProducts.length > 0 ? matchedProducts : undefined,
      timestamp: new Date()
    };

    // Update conversation document
    await db.collection('chatbot_conversations').updateOne(
      { sessionId: currentSessionId },
      {
        $push: {
          messages: {
            $each: [userMsgObj, botMsgObj]
          }
        } as any,
        $setOnInsert: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    // Update the updatedAt timestamp
    await db.collection('chatbot_conversations').updateOne(
      { sessionId: currentSessionId },
      { $set: { updatedAt: new Date() } }
    );

    return NextResponse.json({
      sessionId: currentSessionId,
      reply: replyText,
      suggestions,
      products: matchedProducts,
      categories: matchedCategories,
      isLeadForm: isLeadForm ? true : undefined
    });
  } catch (error: any) {
    console.error('Chatbot message process error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

