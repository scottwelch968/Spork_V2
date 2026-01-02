-- 1. PROFILES: Admin UPDATE and DELETE policies
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all profiles"
ON public.profiles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. WORKSPACES: Admin SELECT + Owner DELETE
CREATE POLICY "Admins can view all workspaces"
ON public.workspaces FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can delete their workspaces"
ON public.workspaces FOR DELETE
USING (auth.uid() = owner_id);

-- 3. MESSAGES: User DELETE
CREATE POLICY "Users can delete messages from their chats"
ON public.messages FOR DELETE
USING (EXISTS (
  SELECT 1 FROM chats
  WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid()
));

-- 4. SPACE_CHAT_MESSAGES: Creator/owner DELETE
CREATE POLICY "Creators and owners can delete space messages"
ON public.space_chat_messages FOR DELETE
USING (EXISTS (
  SELECT 1 FROM space_chats
  JOIN workspaces ON workspaces.id = space_chats.space_id
  WHERE space_chats.id = space_chat_messages.chat_id
  AND (space_chats.user_id = auth.uid() OR workspaces.owner_id = auth.uid())
));

-- 5. GENERATED_CONTENT: User DELETE
CREATE POLICY "Users can delete their own generated content"
ON public.generated_content FOR DELETE
USING (auth.uid() = user_id);